import { NextResponse } from "next/server"
import { setPortalPassword } from "@/lib/booking-portal"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const token = String(body.token || "")
    const password = String(body.password || "")

    if (password.length < 4) {
      return NextResponse.json({ ok: false, message: "パスワードは4文字以上で入力してください。" }, { status: 400 })
    }

    const result = await setPortalPassword(id, token, password)
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.reason }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: "パスワードを設定しました。" })
  } catch (error) {
    return NextResponse.json({ ok: false, message: "パスワード設定に失敗しました。", error: String(error) }, { status: 500 })
  }
}
