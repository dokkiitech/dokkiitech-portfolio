import { createSign } from "crypto"
import { NextResponse } from "next/server"
import { cancelPortalBooking, updatePortalBooking, verifyPortalAccess } from "@/lib/booking-portal"

const DEFAULT_TIMEZONE = process.env.BOOKING_TIMEZONE || "Asia/Tokyo"
const DEFAULT_OFFSET = process.env.BOOKING_TIMEZONE_OFFSET || "+09:00"
const SLOT_MINUTES = Number(process.env.BOOKING_SLOT_MINUTES || "60")

function getMode() {
  return (process.env.BOOKING_BACKEND_MODE || "mock").toLowerCase()
}

function getStartEnd(date: string, timeSlot: string) {
  const start = `${date}T${timeSlot}:00${DEFAULT_OFFSET}`
  const startAt = new Date(start)
  const endAt = new Date(startAt.getTime() + SLOT_MINUTES * 60 * 1000)
  return {
    startDateTime: startAt.toISOString(),
    endDateTime: endAt.toISOString(),
  }
}

function envOrThrow(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is required`)
  return value
}

async function createGoogleAccessToken(): Promise<string> {
  const clientEmail = envOrThrow("GOOGLE_SERVICE_ACCOUNT_EMAIL")
  const privateKey = envOrThrow("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n")
  const delegatedUser = process.env.GOOGLE_DELEGATED_USER_EMAIL
  const now = Math.floor(Date.now() / 1000)

  const header = { alg: "RS256", typ: "JWT" }
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
    ...(delegatedUser ? { sub: delegatedUser } : {}),
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsigned)
  const signature = signer.sign(privateKey).toString("base64url")
  const assertion = `${unsigned}.${signature}`

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })
  if (!tokenResponse.ok) throw new Error(`Google token request failed: ${await tokenResponse.text()}`)
  const tokenJson = (await tokenResponse.json()) as { access_token: string }
  return tokenJson.access_token
}

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

    const nextDate = body.date ? String(body.date) : checked.record.date
    const nextTimeSlot = body.timeSlot ? String(body.timeSlot) : checked.record.time_slot
    const nextBookingType = body.bookingType ? (String(body.bookingType) as "meet" | "対面") : checked.record.booking_type
    const nextLocation = body.location !== undefined ? String(body.location || "") : checked.record.location
    const nextAgenda = body.agenda ? String(body.agenda) : checked.record.agenda
    const nextCompany = body.company !== undefined ? String(body.company || "") : checked.record.company

    let calendarEventUrl = checked.record.calendar_event_url
    let meetUrl = checked.record.meet_url

    if (getMode() === "gcp" && checked.record.calendar_event_id) {
      const calendarId = envOrThrow("GOOGLE_CALENDAR_CALENDAR_ID")
      const accessToken = await createGoogleAccessToken()
      const { startDateTime, endDateTime } = getStartEnd(nextDate, nextTimeSlot)

      const patchResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(
          checked.record.calendar_event_id
        )}?sendUpdates=all&conferenceDataVersion=1`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `打ち合わせ: ${checked.record.name}`,
            description: `予約タイプ: ${nextBookingType}\n会社名: ${nextCompany || "-"}\n相談内容: ${nextAgenda}\n申込者メール: ${checked.record.email}`,
            location: nextBookingType === "対面" ? nextLocation : undefined,
            start: { dateTime: startDateTime, timeZone: DEFAULT_TIMEZONE },
            end: { dateTime: endDateTime, timeZone: DEFAULT_TIMEZONE },
            attendees: [{ email: checked.record.email }],
            conferenceData:
              nextBookingType === "meet"
                ? { createRequest: { requestId: `meet-update-${Date.now()}` } }
                : undefined,
          }),
        }
      )

      if (!patchResponse.ok) {
        return NextResponse.json(
          { ok: false, message: "Google Calendar の予約更新に失敗しました。", error: await patchResponse.text() },
          { status: 502 }
        )
      }

      const patched = (await patchResponse.json()) as { htmlLink?: string; hangoutLink?: string }
      calendarEventUrl = patched.htmlLink || calendarEventUrl
      meetUrl = patched.hangoutLink || meetUrl
    }

    const updated = await updatePortalBooking(id, {
      date: nextDate,
      time_slot: nextTimeSlot,
      booking_type: nextBookingType,
      location: nextLocation,
      agenda: nextAgenda,
      company: nextCompany,
      calendar_event_url: calendarEventUrl || null,
      meet_url: meetUrl || null,
    })

    return NextResponse.json({
      ok: true,
      message: "予約情報を更新しました。",
      record: updated,
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
    return NextResponse.json({
      ok: true,
      message: "予約をキャンセルしました。",
      record: canceled,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, message: "予約キャンセルに失敗しました。", error: String(error) }, { status: 500 })
  }
}
