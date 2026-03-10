import { NextResponse } from "next/server"
import { listBookingPortals, type BookingPortalStatus } from "@/lib/booking-portal"

export const runtime = "nodejs"

function getAdminKey(): string {
  const key = process.env.BOOKING_ADMIN_KEY
  if (!key) {
    throw new Error("BOOKING_ADMIN_KEY is not configured")
  }
  return key
}

function isValidStatus(value: string | null): value is BookingPortalStatus {
  return value === "active" || value === "canceled" || value === "expired"
}

function resolveStatus(status: BookingPortalStatus, expiresAt: string): BookingPortalStatus {
  if (status !== "active") return status
  return new Date(expiresAt).getTime() < Date.now() ? "expired" : "active"
}

export async function GET(request: Request) {
  try {
    const configuredKey = getAdminKey()
    const providedKey = request.headers.get("x-booking-admin-key") || ""

    if (providedKey !== configuredKey) {
      return NextResponse.json({ ok: false, message: "管理者認証に失敗しました。" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || undefined
    const statusParam = searchParams.get("status")
    const status = isValidStatus(statusParam) ? statusParam : "all"

    const records = await listBookingPortals({ date })
    const normalizedRecords = records.map((record) => ({
      ...record,
      status: resolveStatus(record.status, record.expires_at),
    }))
    const filteredRecords =
      status === "all" ? normalizedRecords : normalizedRecords.filter((record) => record.status === status)

    return NextResponse.json({
      ok: true,
      records: filteredRecords.map((record) => ({
        id: record.id,
        bookingId: record.booking_id,
        name: record.name,
        email: record.email,
        company: record.company,
        bookingType: record.booking_type,
        date: record.date,
        timeSlot: record.time_slot,
        agenda: record.agenda,
        location: record.location,
        status: record.status,
        calendarEventUrl: record.calendar_event_url,
        meetUrl: record.meet_url,
        expiresAt: record.expires_at,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      })),
    })
  } catch (error) {
    const message = error instanceof Error && error.message.includes("BOOKING_ADMIN_KEY")
      ? "管理画面キーが未設定です。"
      : "予約一覧の取得に失敗しました。"
    return NextResponse.json({ ok: false, message, error: String(error) }, { status: 500 })
  }
}
