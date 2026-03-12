import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { runMtgSummary } from "@/lib/mtg-summary"

export const runtime = "nodejs"

function secureEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return { ok: false as const, status: 500, message: "CRON_SECRET が未設定です。" }
  }

  const authHeader = request.headers.get("authorization")
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  const headerSecret = request.headers.get("x-cron-secret")
  const provided = bearer || headerSecret

  if (!provided || !secureEqual(provided, secret)) {
    return { ok: false as const, status: 401, message: "認証に失敗しました。" }
  }

  return { ok: true as const }
}


export async function GET(request: Request) {
  const auth = isAuthorized(request)
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status })
  }

  const result = await runMtgSummary()
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
