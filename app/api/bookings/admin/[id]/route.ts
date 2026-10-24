import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getPortalRecord } from "@/lib/booking-portal"
import { rescheduleBooking } from "@/lib/booking-reschedule"

export const runtime = "nodejs"

// 管理画面からの予約日時変更。予約者のトークン/パスワードは不要で、Cloudflare Access の管理者ログインで認可する。
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const body = await request.json()

    const record = await getPortalRecord(id)
    if (!record) {
      return NextResponse.json({ ok: false, message: "予約が見つかりません。" }, { status: 404 })
    }
    if (record.status !== "active") {
      return NextResponse.json({ ok: false, message: "キャンセル済みの予約は変更できません。" }, { status: 400 })
    }

    const result = await rescheduleBooking(
      record,
      { date: String(body.date || ""), timeSlot: String(body.timeSlot || "") },
      {
        actor: "admin",
        skipAvailabilityCheck: body.skipAvailabilityCheck === true,
        notifyCustomer: body.notifyCustomer !== false,
      }
    )
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, ...(result.error ? { error: result.error } : {}) },
        { status: result.status }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "予約日時を変更しました。",
      record: result.record,
      mail: result.mail,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, message: "予約変更に失敗しました。", error: String(error) }, { status: 500 })
  }
}
