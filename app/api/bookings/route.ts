import { NextResponse } from "next/server"
import { bookingSchema } from "@/lib/booking"

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

    // Google Calendar 連携用プレースホルダ
    const integrationEnabled = Boolean(process.env.GOOGLE_CALENDAR_CALENDAR_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)

    return NextResponse.json({
      ok: true,
      bookingId: `mock_${Date.now()}`,
      integrationEnabled,
      message: integrationEnabled
        ? "予約リクエストを受け付けました。Google Calendar 連携を実行します。"
        : "予約リクエストを受け付けました（モック処理）。Google Calendar の環境変数設定後に実連携へ切替できます。",
      request: payload,
      contract: {
        endpoint: "/api/bookings",
        method: "POST",
        requiredEnv: ["GOOGLE_CALENDAR_CALENDAR_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY"],
      },
    })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "予約リクエストの処理中にエラーが発生しました。",
      },
      { status: 500 }
    )
  }
}
