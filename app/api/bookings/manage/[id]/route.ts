import { createSign } from "crypto"
import { NextResponse } from "next/server"
import { cancelPortalBooking, updatePortalBooking, verifyPortalAccess } from "@/lib/booking-portal"
import { sendDiscordConciergeNotification } from "@/lib/discord-concierge"
import { sendMail } from "@/lib/mail"

const DEFAULT_TIMEZONE = process.env.BOOKING_TIMEZONE || "Asia/Tokyo"
const DEFAULT_OFFSET = process.env.BOOKING_TIMEZONE_OFFSET || "+09:00"
const SLOT_MINUTES = Number(process.env.BOOKING_SLOT_MINUTES || "60")
const IN_PERSON_MIN_LEAD_DAYS = 2

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

function isPastSlot(date: string, timeSlot: string): boolean {
  const { startDateTime } = getStartEnd(date, timeSlot)
  return new Date(startDateTime).getTime() <= Date.now()
}

function isMeetTooSoon(date: string, timeSlot: string): boolean {
  const { startDateTime } = getStartEnd(date, timeSlot)
  return new Date(startDateTime).getTime() <= Date.now() + 60 * 60 * 1000
}

function getTodayInTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

function isInPersonLeadTimeInvalid(bookingType: "meet" | "対面", date: string): boolean {
  if (bookingType !== "対面") return false
  const minDate = addDays(getTodayInTimezone(), IN_PERSON_MIN_LEAD_DAYS)
  return date < minDate
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

async function checkSlotBusy(accessToken: string, calendarId: string, date: string, timeSlot: string): Promise<boolean> {
  const { startDateTime, endDateTime } = getStartEnd(date, timeSlot)
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: startDateTime,
      timeMax: endDateTime,
      timeZone: DEFAULT_TIMEZONE,
      items: [{ id: calendarId }],
    }),
  })
  if (!response.ok) throw new Error(`FreeBusy request failed: ${await response.text()}`)
  const json = (await response.json()) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> }
  return (json.calendars?.[calendarId]?.busy || []).length > 0
}

async function hasAllDayBusyEvent(accessToken: string, calendarId: string, date: string): Promise<boolean> {
  const nextDate = addDays(date, 1)
  const dayStartIso = new Date(`${date}T00:00:00${DEFAULT_OFFSET}`).toISOString()
  const dayEndIso = new Date(`${nextDate}T00:00:00${DEFAULT_OFFSET}`).toISOString()
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&timeMin=${encodeURIComponent(dayStartIso)}&timeMax=${encodeURIComponent(dayEndIso)}&maxResults=250`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) throw new Error(`Events list request failed: ${await response.text()}`)

  const json = (await response.json()) as {
    items?: Array<{
      status?: string
      transparency?: string
      start?: { date?: string; dateTime?: string }
      end?: { date?: string; dateTime?: string }
    }>
  }

  return (json.items || []).some((item) => {
    if (item.status === "cancelled") return false
    if (item.transparency === "transparent") return false
    return Boolean(item.start?.date || item.end?.date)
  })
}

const UPDATE_FROM_ADDRESS = "reappointment@dokkiitech.dev"
const CANCEL_FROM_ADDRESS = "unappointment@dokkiitech.dev"

function formatDateJp(date: string): string {
  const [y, m, d] = date.split("-")
  return `${y}年${m}月${d}日`
}

function calcEndTime(timeSlot: string): string {
  const start = new Date(`2000-01-01T${timeSlot}:00+09:00`)
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000)
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
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
    const requestedBookingType = body.bookingType ? (String(body.bookingType) as "meet" | "対面") : checked.record.booking_type
    const nextBookingType = checked.record.booking_type
    if (requestedBookingType !== checked.record.booking_type) {
      return NextResponse.json(
        { ok: false, message: "予約タイプ（Meet/対面）は変更できません。新規予約で切り替えてください。" },
        { status: 400 }
      )
    }
    const nextLocation = body.location !== undefined ? String(body.location || "") : checked.record.location
    const nextAgenda = body.agenda ? String(body.agenda) : checked.record.agenda
    const nextCompany = body.company !== undefined ? String(body.company || "") : checked.record.company

    if (nextDate === checked.record.date && nextTimeSlot === checked.record.time_slot) {
      return NextResponse.json(
        { ok: false, message: "現在と同じ日時には変更できません。別の時間を選択してください。" },
        { status: 400 }
      )
    }

    if (isPastSlot(nextDate, nextTimeSlot)) {
      return NextResponse.json(
        { ok: false, message: "過去の時間帯は予約できません。未来の時間を選択してください。" },
        { status: 400 }
      )
    }
    if (nextBookingType === "meet" && isMeetTooSoon(nextDate, nextTimeSlot)) {
      return NextResponse.json(
        { ok: false, message: "Meet予約は1時間後以降の時間帯を選択してください。" },
        { status: 400 }
      )
    }
    if (isInPersonLeadTimeInvalid(nextBookingType, nextDate)) {
      return NextResponse.json(
        { ok: false, message: "対面の予約は2日前から可能です。別の日付を選択してください。" },
        { status: 400 }
      )
    }

    let calendarEventUrl = checked.record.calendar_event_url
    let meetUrl = checked.record.meet_url

    if (getMode() === "gcp" && checked.record.calendar_event_id) {
      const calendarId = envOrThrow("GOOGLE_CALENDAR_CALENDAR_ID")
      const accessToken = await createGoogleAccessToken()
      const changedSlot = nextDate !== checked.record.date || nextTimeSlot !== checked.record.time_slot
      if (changedSlot) {
        const allDayBusy = await hasAllDayBusyEvent(accessToken, calendarId, nextDate)
        if (allDayBusy) {
          return NextResponse.json(
            { ok: false, message: "この日は終日予定が入っているため予約できません。別の日付を選択してください。" },
            { status: 409 }
          )
        }
        const busy = await checkSlotBusy(accessToken, calendarId, nextDate, nextTimeSlot)
        if (busy) {
          return NextResponse.json(
            { ok: false, message: "選択した時間帯は空いていません。別の時間を選択してください。" },
            { status: 409 }
          )
        }
      }
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

    const dateJp = formatDateJp(nextDate)
    const endTime = calcEndTime(nextTimeSlot)
    const salutation = `${nextCompany ? `${nextCompany} ` : ""}${checked.record.name}さま`
    const formatLine = nextBookingType === "meet" ? "Google Meet" : `対面（${nextLocation || "-"})`
    const mail = await sendMail(
      checked.record.email,
      "予約変更のお知らせ",
      `
      <p>${salutation}</p>
      <p>お打ち合わせの予約内容を変更しました。下記の内容で更新されました。</p>
      <ul>
        <li>予約番号：${checked.record.booking_id}</li>
        <li>日程：${dateJp}</li>
        <li>時刻：${nextTimeSlot} - ${endTime}</li>
        <li>形式：${formatLine}</li>
        ${meetUrl ? `<li>Meet URL：${meetUrl}</li>` : ""}
      </ul>
      <p>Googleカレンダーの予定にも変更内容が反映されます。</p>
      `,
      "dokkiitech予約管理システム予約変更センター",
      UPDATE_FROM_ADDRESS
    )

    const discord = await sendDiscordConciergeNotification("updated", {
      bookingId: checked.record.booking_id,
      name: checked.record.name,
      email: checked.record.email,
      company: nextCompany,
      bookingType: nextBookingType,
      date: nextDate,
      timeSlot: nextTimeSlot,
      agenda: nextAgenda,
      location: nextLocation,
      status: "予約変更",
      meetUrl,
      calendarEventUrl,
    }).catch((error) => ({ sent: false, reason: String(error) }))
    if (!discord.sent) {
      console.error("Failed to send Discord concierge notification (update):", discord.reason)
    }

    return NextResponse.json({
      ok: true,
      message: "予約情報を更新しました。",
      record: updated,
      mail,
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
