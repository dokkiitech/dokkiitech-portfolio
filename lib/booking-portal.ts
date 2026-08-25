import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb"

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

interface ListBookingPortalsFilters {
  date?: string
  status?: BookingPortalStatus | "all"
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

let docClient: DynamoDBDocumentClient | null = null

function getTableName(): string {
  const tableName = process.env.BOOKING_TABLE_NAME
  if (!tableName) {
    throw new Error("DynamoDB env missing: set BOOKING_TABLE_NAME")
  }
  return tableName
}

function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-1" })
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    })
  }
  return docClient
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

export async function createBookingPortal(input: CreatePortalInput) {
  const token = randomBytes(24).toString("hex")
  const initialPassword = randomBytes(6).toString("base64url")
  const id = randomUUID()
  const expiresAt = `${input.date}T23:59:59+09:00`
  const now = new Date().toISOString()
  const record: BookingPortalRecord = {
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
    manage_password_hash: hashPassword(initialPassword),
    expires_at: expiresAt,
    created_at: now,
    updated_at: now,
  }

  try {
    await getDocClient().send(
      new PutCommand({
        TableName: getTableName(),
        Item: record,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )
  } catch (error) {
    throw new Error(`Failed to create booking portal: ${String(error)}`)
  }

  return { id, token, expiresAt, initialPassword }
}

async function getPortalRecord(id: string): Promise<BookingPortalRecord | null> {
  const result = await getDocClient().send(
    new GetCommand({ TableName: getTableName(), Key: { id } })
  )
  return (result.Item as BookingPortalRecord | undefined) || null
}

async function bookingIdExists(bookingId: string): Promise<boolean> {
  const result = await getDocClient().send(
    new QueryCommand({
      TableName: getTableName(),
      IndexName: "booking_id-index",
      KeyConditionExpression: "booking_id = :booking_id",
      ExpressionAttributeValues: { ":booking_id": bookingId },
      Limit: 1,
    })
  )
  return (result.Items || []).length > 0
}

export async function generateBookingReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = String(Math.floor(100000000 + Math.random() * 900000000))
    try {
      if (!(await bookingIdExists(candidate))) {
        return candidate
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("DynamoDB env missing")) {
        return candidate
      }
      throw error
    }
  }

  throw new Error("Failed to generate a unique booking reference")
}

export async function listBookingPortals(filters: ListBookingPortalsFilters = {}): Promise<BookingPortalRecord[]> {
  const conditions: string[] = []
  const names: Record<string, string> = {}
  const values: Record<string, string> = {}

  if (filters.date) {
    conditions.push("#date = :date")
    names["#date"] = "date"
    values[":date"] = filters.date
  }

  if (filters.status && filters.status !== "all") {
    conditions.push("#status = :status")
    names["#status"] = "status"
    values[":status"] = filters.status
  }

  const records: BookingPortalRecord[] = []
  let lastEvaluatedKey: Record<string, unknown> | undefined
  do {
    const result = await getDocClient().send(
      new ScanCommand({
        TableName: getTableName(),
        ...(conditions.length > 0
          ? {
              FilterExpression: conditions.join(" AND "),
              ExpressionAttributeNames: names,
              ExpressionAttributeValues: values,
            }
          : {}),
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )
    records.push(...((result.Items as BookingPortalRecord[]) || []))
    lastEvaluatedKey = result.LastEvaluatedKey
  } while (lastEvaluatedKey)

  return records.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.time_slot.localeCompare(a.time_slot) ||
      b.created_at.localeCompare(a.created_at)
  )
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

async function updatePortalFields(
  id: string,
  fields: Record<string, string | null>
): Promise<BookingPortalRecord> {
  const entries = Object.entries({ ...fields, updated_at: new Date().toISOString() })
  const names: Record<string, string> = {}
  const values: Record<string, string | null> = {}
  const sets = entries.map(([key, value], idx) => {
    names[`#f${idx}`] = key
    values[`:v${idx}`] = value
    return `#f${idx} = :v${idx}`
  })

  const result = await getDocClient().send(
    new UpdateCommand({
      TableName: getTableName(),
      Key: { id },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ConditionExpression: "attribute_exists(id)",
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  )
  return result.Attributes as BookingPortalRecord
}

export async function setPortalPassword(id: string, token: string, password: string): Promise<PortalAccess> {
  const checked = await verifyPortalAccess(id, token)
  if (!checked.ok || !checked.record) return checked
  if (checked.record.manage_password_hash) return { ok: false, reason: "パスワードは既に設定されています。" }

  try {
    const record = await updatePortalFields(id, { manage_password_hash: hashPassword(password) })
    return { ok: true, record }
  } catch {
    return { ok: false, reason: "パスワードの保存に失敗しました。" }
  }
}

export async function updatePortalBooking(
  id: string,
  patch: Partial<
    Pick<
      BookingPortalRecord,
      "date" | "time_slot" | "booking_type" | "location" | "agenda" | "company" | "calendar_event_url" | "meet_url"
    >
  >
) {
  try {
    return await updatePortalFields(id, patch as Record<string, string | null>)
  } catch (error) {
    throw new Error(`Failed to update booking portal: ${String(error)}`)
  }
}

export async function cancelPortalBooking(id: string) {
  try {
    return await updatePortalFields(id, { status: "canceled" })
  } catch (error) {
    throw new Error(`Failed to cancel booking portal: ${String(error)}`)
  }
}
