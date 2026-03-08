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
    const mode = (process.env.BOOKING_BACKEND_MODE || "mock").toLowerCase()

    if (mode === "api") {
      const upstreamUrl = process.env.BOOKING_API_URL
      if (!upstreamUrl) {
        return NextResponse.json(
          {
            ok: false,
            message: "BOOKING_API_URL が未設定です。`BOOKING_BACKEND_MODE=mock` で運用してください。",
          },
          { status: 500 }
        )
      }

      const upstreamResponse = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.BOOKING_API_KEY ? { Authorization: `Bearer ${process.env.BOOKING_API_KEY}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const upstreamJson = await upstreamResponse.json().catch(() => ({}))

      if (!upstreamResponse.ok) {
        return NextResponse.json(
          {
            ok: false,
            mode,
            message: "外部予約API連携に失敗しました。",
            upstreamStatus: upstreamResponse.status,
            upstream: upstreamJson,
          },
          { status: 502 }
        )
      }

      return NextResponse.json({
        ok: true,
        mode,
        message: "外部予約APIへ送信しました。",
        upstream: upstreamJson,
      })
    }

    return NextResponse.json({
      ok: true,
      mode: "mock",
      bookingId: `mock_${Date.now()}`,
      message: "予約リクエストを受け付けました（モック処理）。",
      request: payload,
      contract: {
        endpoint: "/api/bookings",
        method: "POST",
        modeEnv: "BOOKING_BACKEND_MODE=mock|api",
        requiredEnvForApiMode: ["BOOKING_API_URL"],
        optionalEnvForApiMode: ["BOOKING_API_KEY"],
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
