import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto"

export type BookingPortalStatus = "active" | "canceled" | "expired"

export interface BookingPortalRecord {
  id: string
  booking_id: string
  name: string
  email: string
  company: string | null
  booking_type: "meet" | "対面"
  date: string
  time_slot: string
  agenda: string
  location: string | null
  status: BookingPortalStatus
  calendar_event_id: string | null
  calendar_event_url: string | null
  meet_url: string | null
  manage_token_hash: string
  manage_password_hash: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

interface CreatePortalInput {
  bookingId: string
  name: string
  email: string
  company?: string
  bookingType: "meet" | "対面"
  date: string
  timeSlot: string
  agenda: string
  location?: string
  calendarEventId?: string
  calendarEventUrl?: string
  meetUrl?: string
}

interface PortalAccess {
  ok: boolean
  reason?: string
  record?: BookingPortalRecord
}

function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  return { url, serviceKey }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

function verifyPassword(password: string, hashed: string): boolean {
  const [salt, saved] = hashed.split(":")
  if (!salt || !saved) return false
  const generated = scryptSync(password, salt, 64).toString("hex")
  return timingSafeEqual(Buffer.from(saved, "hex"), Buffer.from(generated, "hex"))
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const { url, serviceKey } = getSupabaseEnv()
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers || {}),
    },
  })
}

export async function createBookingPortal(input: CreatePortalInput) {
  const token = randomBytes(24).toString("hex")
  const id = randomUUID()
  const expiresAt = `${input.date}T23:59:59+09:00`
  const payload = {
    id,
    booking_id: input.bookingId,
    name: input.name,
    email: input.email,
    company: input.company || null,
    booking_type: input.bookingType,
    date: input.date,
    time_slot: input.timeSlot,
    agenda: input.agenda,
    location: input.location || null,
    status: "active",
    calendar_event_id: input.calendarEventId || null,
    calendar_event_url: input.calendarEventUrl || null,
    meet_url: input.meetUrl || null,
    manage_token_hash: hashToken(token),
    manage_password_hash: null,
    expires_at: expiresAt,
  }

  const response = await supabaseFetch("booking_portal", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`Failed to create booking portal: ${await response.text()}`)

  return { id, token, expiresAt }
}

async function getPortalRecord(id: string): Promise<BookingPortalRecord | null> {
  const response = await supabaseFetch(`booking_portal?id=eq.${encodeURIComponent(id)}&select=*`)
  if (!response.ok) throw new Error(`Failed to fetch booking portal: ${await response.text()}`)
  const rows = (await response.json()) as BookingPortalRecord[]
  return rows[0] || null
}

export async function verifyPortalAccess(id: string, token: string, password?: string): Promise<PortalAccess> {
  const record = await getPortalRecord(id)
  if (!record) return { ok: false, reason: "予約管理ページが見つかりません。" }
  if (record.status !== "active") return { ok: false, reason: "この予約は有効ではありません。" }
  if (new Date(record.expires_at).getTime() < Date.now()) return { ok: false, reason: "予約管理ページの有効期限が切れています。" }
  if (record.manage_token_hash !== hashToken(token)) return { ok: false, reason: "トークンが無効です。" }

  if (record.manage_password_hash) {
    if (!password) return { ok: false, reason: "パスワードを入力してください。" }
    if (!verifyPassword(password, record.manage_password_hash)) return { ok: false, reason: "パスワードが一致しません。" }
  }

  return { ok: true, record }
}

export async function setPortalPassword(id: string, token: string, password: string): Promise<PortalAccess> {
  const checked = await verifyPortalAccess(id, token)
  if (!checked.ok || !checked.record) return checked
  if (checked.record.manage_password_hash) return { ok: false, reason: "パスワードは既に設定されています。" }

  const response = await supabaseFetch(`booking_portal?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      manage_password_hash: hashPassword(password),
      updated_at: new Date().toISOString(),
    }),
  })
  if (!response.ok) return { ok: false, reason: "パスワードの保存に失敗しました。" }
  const rows = (await response.json()) as BookingPortalRecord[]
  return { ok: true, record: rows[0] }
}

export async function updatePortalBooking(
  id: string,
  patch: Partial<Pick<BookingPortalRecord, "date" | "time_slot" | "booking_type" | "location" | "agenda" | "company">>
) {
  const response = await supabaseFetch(`booking_portal?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...patch,
      updated_at: new Date().toISOString(),
    }),
  })
  if (!response.ok) throw new Error(`Failed to update booking portal: ${await response.text()}`)
  const rows = (await response.json()) as BookingPortalRecord[]
  return rows[0]
}

export async function cancelPortalBooking(id: string) {
  const response = await supabaseFetch(`booking_portal?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "canceled",
      updated_at: new Date().toISOString(),
    }),
  })
  if (!response.ok) throw new Error(`Failed to cancel booking portal: ${await response.text()}`)
  const rows = (await response.json()) as BookingPortalRecord[]
  return rows[0]
}
