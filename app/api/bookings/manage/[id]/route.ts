import { NextResponse } from "next/server"
import { cancelPortalBooking, updatePortalBooking, verifyPortalAccess } from "@/lib/booking-portal"

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

    const updated = await updatePortalBooking(id, {
      date: body.date ? String(body.date) : checked.record.date,
      time_slot: body.timeSlot ? String(body.timeSlot) : checked.record.time_slot,
      booking_type: body.bookingType ? String(body.bookingType) as "meet" | "対面" : checked.record.booking_type,
      location: body.location !== undefined ? String(body.location || "") : checked.record.location,
      agenda: body.agenda ? String(body.agenda) : checked.record.agenda,
      company: body.company !== undefined ? String(body.company || "") : checked.record.company,
    })

    return NextResponse.json({
      ok: true,
      message: "予約情報を更新しました。",
      record: updated,
      note: "現在は予約管理DBを更新します。Google Calendarイベント同期を行う場合はこのエンドポイントに同期処理を追加してください。",
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

    const canceled = await cancelPortalBooking(id)
    return NextResponse.json({
      ok: true,
      message: "予約をキャンセルしました。",
      record: canceled,
      note: "現在は予約管理DBを更新します。Google Calendarイベント同期を行う場合はこのエンドポイントに同期処理を追加してください。",
    })
  } catch (error) {
    return NextResponse.json({ ok: false, message: "予約キャンセルに失敗しました。", error: String(error) }, { status: 500 })
  }
}
