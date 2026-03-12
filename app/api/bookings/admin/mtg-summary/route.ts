import { NextResponse } from "next/server"
import { runMtgSummary } from "@/lib/mtg-summary"

export const runtime = "nodejs"

export async function POST() {
  try {
    const result = await runMtgSummary()
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "MTG サマリーの手動送信に失敗しました。",
        detail: String(error),
      },
      { status: 500 }
    )
  }
}
