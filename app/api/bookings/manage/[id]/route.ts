import { NextResponse } from "next/server"
import {
  calcEndTime,
  createGoogleAccessToken,
  envOrThrow,
  formatDateJp,
  getMode,
} from "@/lib/booking-calendar"
import { cancelPortalBooking, verifyPortalAccess } from "@/lib/booking-portal"
import { rescheduleBooking } from "@/lib/booking-reschedule"
import { sendDiscordConciergeNotification } from "@/lib/discord-concierge"
import { sendMail } from "@/lib/mail"

const CANCEL_FROM_ADDRESS = "unappointment@dokkiitech.work"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const token = String(body.token || "")
    const password = String(body.password || "")

    const checked = await verifyPortalAccess(id, token, password)
    if (!checked.ok || !checked.record) {
      return NextResponse.json({ ok: false, message: checked.reason }, { status: 401 })
    }

    const requestedBookingType = body.bookingType ? (String(body.bookingType) as "meet" | "対面") : checked.record.booking_type
    if (requestedBookingType !== checked.record.booking_type) {
      return NextResponse.json(
        { ok: false, message: "予約タイプ（Meet/対面）は変更できません。新規予約で切り替えてください。" },
        { status: 400 }
      )
    }

    const result = await rescheduleBooking(
      checked.record,
      {
        date: body.date ? String(body.date) : checked.record.date,
        timeSlot: body.timeSlot ? String(body.timeSlot) : checked.record.time_slot,
        location: body.location !== undefined ? String(body.location || "") : undefined,
        agenda: body.agenda ? String(body.agenda) : undefined,
        company: body.company !== undefined ? String(body.company || "") : undefined,
      },
      { actor: "customer" }
    )
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, ...(result.error ? { error: result.error } : {}) },
        { status: result.status }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "予約情報を更新しました。",
      record: result.record,
      mail: result.mail,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, message: "予約変更に失敗しました。", error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const token = String(body.token || "")
    const password = String(body.password || "")

    const checked = await verifyPortalAccess(id, token, password)
    if (!checked.ok || !checked.record) {
      return NextResponse.json({ ok: false, message: checked.reason }, { status: 401 })
    }

    if (getMode() === "gcp" && checked.record.calendar_event_id) {
      const calendarId = envOrThrow("GOOGLE_CALENDAR_CALENDAR_ID")
      const accessToken = await createGoogleAccessToken()
      const deleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(
          checked.record.calendar_event_id
        )}?sendUpdates=all`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        return NextResponse.json(
          { ok: false, message: "Google Calendar の予約キャンセルに失敗しました。", error: await deleteResponse.text() },
          { status: 502 }
        )
      }
    }

    const canceled = await cancelPortalBooking(id)
    const dateJp = formatDateJp(checked.record.date)
    const endTime = calcEndTime(checked.record.time_slot)
    const salutation = `${checked.record.company ? `${checked.record.company} ` : ""}${checked.record.name}さま`
    const formatLine =
      checked.record.booking_type === "meet"
        ? "Google Meet"
        : `対面（${checked.record.location || "-"})`
    const mail = await sendMail(
      checked.record.email,
      "予約キャンセルのお知らせ",
      `
      <p>${salutation}</p>
      <p>お打ち合わせのご予約をキャンセルしました。下記の内容がキャンセル対象です。</p>
      <ul>
        <li>予約番号：${checked.record.booking_id}</li>
        <li>日程：${dateJp}</li>
        <li>時刻：${checked.record.time_slot} - ${endTime}</li>
        <li>形式：${formatLine}</li>
      </ul>
      <p>Googleカレンダーの予定もキャンセルされます。</p>
      `,
      "dokkiitech予約管理システムキャンセル承りセンター",
      CANCEL_FROM_ADDRESS
    )

    const discord = await sendDiscordConciergeNotification("canceled", {
      bookingId: checked.record.booking_id,
      name: checked.record.name,
      email: checked.record.email,
      company: checked.record.company,
      bookingType: checked.record.booking_type,
      date: checked.record.date,
      timeSlot: checked.record.time_slot,
      agenda: checked.record.agenda,
      location: checked.record.location,
      status: "キャンセル",
      meetUrl: checked.record.meet_url,
      calendarEventUrl: checked.record.calendar_event_url,
    }).catch((error) => ({ sent: false, reason: String(error) }))
    if (!discord.sent) {
      console.error("Failed to send Discord concierge notification (cancel):", discord.reason)
    }

    return NextResponse.json({
      ok: true,
      message: "予約をキャンセルしました。",
      record: canceled,
      mail,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, message: "予約キャンセルに失敗しました。", error: String(error) }, { status: 500 })
  }
}
