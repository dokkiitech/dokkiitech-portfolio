import { NextResponse } from "next/server"
import { verifyPortalAccess } from "@/lib/booking-portal"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const token = String(body.token || "")
    const password = body.password ? String(body.password) : undefined

    const checked = await verifyPortalAccess(id, token, password)
    if (!checked.ok || !checked.record) {
      return NextResponse.json({ ok: false, message: checked.reason }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      record: {
        id: checked.record.id,
        bookingId: checked.record.booking_id,
        name: checked.record.name,
        email: checked.record.email,
        company: checked.record.company,
        bookingType: checked.record.booking_type,
        date: checked.record.date,
        timeSlot: checked.record.time_slot,
        location: checked.record.location,
        agenda: checked.record.agenda,
        status: checked.record.status,
        expiresAt: checked.record.expires_at,
        meetUrl: checked.record.meet_url,
        calendarEventUrl: checked.record.calendar_event_url,
        passwordSet: Boolean(checked.record.manage_password_hash),
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, message: "認証処理に失敗しました。", error: String(error) }, { status: 500 })
  }
}
