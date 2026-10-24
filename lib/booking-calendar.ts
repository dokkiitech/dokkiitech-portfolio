import { createSign } from "crypto"

export const DEFAULT_TIMEZONE = process.env.BOOKING_TIMEZONE || "Asia/Tokyo"
export const DEFAULT_OFFSET = process.env.BOOKING_TIMEZONE_OFFSET || "+09:00"
export const SLOT_MINUTES = Number(process.env.BOOKING_SLOT_MINUTES || "60")
const IN_PERSON_MIN_LEAD_DAYS = 2

export function getMode() {
  return (process.env.BOOKING_BACKEND_MODE || "mock").toLowerCase()
}

export function getStartEnd(date: string, timeSlot: string) {
  const start = `${date}T${timeSlot}:00${DEFAULT_OFFSET}`
  const startAt = new Date(start)
  const endAt = new Date(startAt.getTime() + SLOT_MINUTES * 60 * 1000)
  return {
    startDateTime: startAt.toISOString(),
    endDateTime: endAt.toISOString(),
  }
}

export function isPastSlot(date: string, timeSlot: string): boolean {
  const { startDateTime } = getStartEnd(date, timeSlot)
  return new Date(startDateTime).getTime() <= Date.now()
}

export function isMeetTooSoon(date: string, timeSlot: string): boolean {
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

export function isInPersonLeadTimeInvalid(bookingType: "meet" | "対面", date: string): boolean {
  if (bookingType !== "対面") return false
  const minDate = addDays(getTodayInTimezone(), IN_PERSON_MIN_LEAD_DAYS)
  return date < minDate
}

export function envOrThrow(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is required`)
  return value
}

export async function createGoogleAccessToken(): Promise<string> {
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

export async function checkSlotBusy(accessToken: string, calendarId: string, date: string, timeSlot: string): Promise<boolean> {
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

export async function hasAllDayBusyEvent(accessToken: string, calendarId: string, date: string): Promise<boolean> {
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

export function formatDateJp(date: string): string {
  const [y, m, d] = date.split("-")
  return `${y}年${m}月${d}日`
}

export function calcEndTime(timeSlot: string): string {
  // Date#getHours() はサーバーのローカルTZ依存(Vercel は UTC)のため算術で求める
  const [hour, minute] = timeSlot.split(":").map(Number)
  const total = hour * 60 + minute + SLOT_MINUTES
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}
