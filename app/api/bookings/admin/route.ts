import { NextResponse } from "next/server"
import { listBookingPortals, type BookingPortalStatus } from "@/lib/booking-portal"

export const runtime = "nodejs"

function isValidStatus(value: string | null): value is BookingPortalStatus {
  return value === "active" || value === "canceled" || value === "expired"
}

function resolveStatus(status: BookingPortalStatus, expiresAt: string): BookingPortalStatus {
  if (status !== "active") return status
  return new Date(expiresAt).getTime() < Date.now() ? "expired" : "active"
}

export async function GET(request: Request) {
  try {
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
    return NextResponse.json({ ok: false, message: "予約一覧の取得に失敗しました。", error: String(error) }, { status: 500 })
  }
}
