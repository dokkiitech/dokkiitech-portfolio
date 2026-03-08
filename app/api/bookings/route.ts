import { createSign } from "crypto"
import { NextResponse } from "next/server"
import { bookingSchema } from "@/lib/booking"

export const runtime = "nodejs"

const DEFAULT_TIMEZONE = process.env.BOOKING_TIMEZONE || "Asia/Tokyo"
const DEFAULT_OFFSET = process.env.BOOKING_TIMEZONE_OFFSET || "+09:00"
const SLOT_MINUTES = Number(process.env.BOOKING_SLOT_MINUTES || "60")
const SLOT_START_HOUR = Number(process.env.BOOKING_SLOT_START_HOUR || "10")
const SLOT_END_HOUR = Number(process.env.BOOKING_SLOT_END_HOUR || "24")

type BookingMode = "mock" | "gcp"

function getMode(): BookingMode {
  const mode = (process.env.BOOKING_BACKEND_MODE || "mock").toLowerCase()
  return mode === "gcp" ? "gcp" : "mock"
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

function getDefaultSlots(date: string) {
  const start = Math.max(0, Math.min(23, SLOT_START_HOUR))
  const end = Math.max(start + 1, Math.min(24, SLOT_END_HOUR))
  void date
  return Array.from({ length: end - start }, (_, idx) => {
    const hour = start + idx
    return `${String(hour).padStart(2, "0")}:00`
  })
}

function isPastSlot(date: string, timeSlot: string): boolean {
  const { startDateTime } = getStartEnd(date, timeSlot)
  return new Date(startDateTime).getTime() <= Date.now()
}

function envOrThrow(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is required`)
  return value
}

function buildGoogleErrorHint(reason: string): string {
  const lower = reason.toLowerCase()
  if (lower.includes("forbiddenforserviceaccounts")) {
    return "attendees招待には Domain-Wide Delegation が必要です。GOOGLE_DELEGATED_USER_EMAIL を設定し、管理コンソールで Calendar スコープを委任してください。"
  }
  if (lower.includes("insufficient permissions") || lower.includes("forbidden")) {
    return "サービスアカウントの権限不足です。対象カレンダーで「予定の変更」権限を付与してください。"
  }
  if (lower.includes("conference") || lower.includes("hangout")) {
    return "Meet URL生成に失敗しています。Google Workspace/Meet利用可否、または会議データ作成権限を確認してください。"
  }
  if (lower.includes("not found")) {
    return "GOOGLE_CALENDAR_CALENDAR_ID が不正か、対象カレンダーにアクセス権がありません。"
  }
  return "Google Calendar API のエラー内容を確認してください。"
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

  if (!tokenResponse.ok) {
    const reason = await tokenResponse.text()
    throw new Error(`Google token request failed: ${reason}`)
  }

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

  if (!response.ok) {
    const reason = await response.text()
    throw new Error(`FreeBusy request failed: ${reason}`)
  }

  const json = (await response.json()) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> }
  const busyList = json.calendars?.[calendarId]?.busy || []
  return busyList.length > 0
}

async function listAvailableSlots(accessToken: string, calendarId: string, date: string): Promise<string[]> {
  const candidates = getDefaultSlots(date)
  const result: string[] = []
  for (const slot of candidates) {
    const busy = await checkSlotBusy(accessToken, calendarId, date, slot)
    if (!busy) result.push(slot)
  }
  return result
}

async function sendResendMail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) return { sent: false, reason: "RESEND_API_KEY or RESEND_FROM missing" }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    return { sent: false, reason: await response.text() }
  }

  return { sent: true }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    if (!date) {
      return NextResponse.json({ ok: false, message: "date(YYYY-MM-DD) が必要です。" }, { status: 400 })
    }

    const mode = getMode()
    if (mode === "mock") {
      const slots = getDefaultSlots(date).filter((slot) => !isPastSlot(date, slot))
      return NextResponse.json({
        ok: true,
        mode,
        date,
        slots,
      })
    }

    const calendarId = envOrThrow("GOOGLE_CALENDAR_CALENDAR_ID")
    const accessToken = await createGoogleAccessToken()
    const slots = (await listAvailableSlots(accessToken, calendarId, date)).filter((slot) => !isPastSlot(date, slot))
    return NextResponse.json({ ok: true, mode, date, slots })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "空き時間の取得に失敗しました。", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "入力内容に不備があります。",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const payload = parsed.data
    const mode = getMode()

    if (isPastSlot(payload.date, payload.timeSlot)) {
      return NextResponse.json(
        { ok: false, mode, message: "過去の時間帯は予約できません。未来の時間を選択してください。" },
        { status: 400 }
      )
    }

    if (mode === "mock") {
      return NextResponse.json({
        ok: true,
        mode,
        bookingId: `mock_${Date.now()}`,
        message: "予約リクエストを受け付けました（モック処理）。",
        request: payload,
        contract: {
          endpoint: "/api/bookings",
          method: "POST",
          availabilityEndpoint: "/api/bookings?date=YYYY-MM-DD",
          modeEnv: "BOOKING_BACKEND_MODE=mock|gcp",
          requiredEnvForGcpMode: [
            "GOOGLE_CALENDAR_CALENDAR_ID",
            "GOOGLE_SERVICE_ACCOUNT_EMAIL",
            "GOOGLE_PRIVATE_KEY",
          ],
          optionalEnvForGcpMode: ["RESEND_API_KEY", "RESEND_FROM"],
        },
      })
    }

    const calendarId = envOrThrow("GOOGLE_CALENDAR_CALENDAR_ID")
    const accessToken = await createGoogleAccessToken()
    const busy = await checkSlotBusy(accessToken, calendarId, payload.date, payload.timeSlot)
    if (busy) {
      return NextResponse.json(
        { ok: false, mode, message: "選択した時間帯はすでに予約されています。別の時間を選択してください。" },
        { status: 409 }
      )
    }

    const { startDateTime, endDateTime } = getStartEnd(payload.date, payload.timeSlot)
    const summary = `打ち合わせ: ${payload.name}`
    const description = `予約タイプ: ${payload.bookingType}\n会社名: ${payload.company || "-"}\n相談内容: ${payload.agenda}\n申込者メール: ${payload.email}`

    const createEventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          description,
          location: payload.bookingType === "対面" ? payload.location : undefined,
          start: { dateTime: startDateTime, timeZone: DEFAULT_TIMEZONE },
          end: { dateTime: endDateTime, timeZone: DEFAULT_TIMEZONE },
          attendees: [{ email: payload.email }],
          conferenceData:
            payload.bookingType === "meet"
              ? { createRequest: { requestId: `meet-${Date.now()}` } }
              : undefined,
        }),
      }
    )

    if (!createEventResponse.ok) {
      const reason = await createEventResponse.text()
      return NextResponse.json(
        {
          ok: false,
          mode,
          message: "Google Calendar への予約登録に失敗しました。",
          error: reason,
          hint: buildGoogleErrorHint(reason),
        },
        { status: 502 }
      )
    }

    const event = (await createEventResponse.json()) as {
      id?: string
      htmlLink?: string
      hangoutLink?: string
      location?: string
    }

    const mailResult = await sendResendMail(
      payload.email,
      "予約完了のお知らせ",
      `
      <p>${payload.name} 様</p>
      <p>ご予約ありがとうございます。以下内容で受け付けました。</p>
      <ul>
        <li>日付: ${payload.date}</li>
        <li>時間: ${payload.timeSlot}</li>
        <li>形式: ${payload.bookingType}</li>
        <li>会社名: ${payload.company || "-"}</li>
        <li>Meet URL: ${event.hangoutLink || "カレンダー招待をご確認ください"}</li>
        <li>場所: ${payload.bookingType === "対面" ? payload.location || "-" : "-"}</li>
      </ul>
      <p>カレンダー招待メールも送信されています。</p>
      `
    )

    return NextResponse.json({
      ok: true,
      mode,
      message: "予約を確定しました。Google Calendar 招待と完了メールを送信しました。",
      bookingId: event.id,
      calendarEventUrl: event.htmlLink,
      meetUrl: event.hangoutLink,
      location: event.location,
      resend: mailResult,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "予約リクエストの処理中にエラーが発生しました。",
        error: String(error),
      },
      { status: 500 }
    )
  }
}
