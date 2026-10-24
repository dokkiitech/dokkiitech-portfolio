import { createPublicKey, createVerify, type JsonWebKey } from "crypto"
import { NextResponse } from "next/server"

// 管理画面 (/appointment/admin) は Cloudflare Access で保護されている。
// 管理 API も同じ Access のログイン (CF_Authorization Cookie / Cf-Access-Jwt-Assertion ヘッダ) を検証して守る。
// Vercel のオリジンに直接来たリクエストもここで弾かれる。
const TEAM_DOMAIN = process.env.CF_ACCESS_TEAM_DOMAIN || "dokkiitech.cloudflareaccess.com"
const AUDIENCE =
  process.env.CF_ACCESS_AUD || "4b33a154ecd7831164da9184af8758c29896d91b7787185b43bdd44b4d88dea8"
const CERTS_TTL_MS = 60 * 60 * 1000

interface AccessJwk extends JsonWebKey {
  kid: string
}

let certsCache: { keys: AccessJwk[]; fetchedAt: number } | null = null

async function getCerts(forceRefresh = false): Promise<AccessJwk[]> {
  if (!forceRefresh && certsCache && Date.now() - certsCache.fetchedAt < CERTS_TTL_MS) return certsCache.keys
  const response = await fetch(`https://${TEAM_DOMAIN}/cdn-cgi/access/certs`, { cache: "no-store" })
  if (!response.ok) throw new Error(`Cloudflare Access certs request failed: ${response.status}`)
  const json = (await response.json()) as { keys?: AccessJwk[] }
  certsCache = { keys: json.keys || [], fetchedAt: Date.now() }
  return certsCache.keys
}

function getToken(request: Request): string | null {
  const header = request.headers.get("cf-access-jwt-assertion")
  if (header) return header
  const cookie = request.headers.get("cookie") || ""
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function decodeSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T
}

export async function verifyAccessJwt(token: string): Promise<{ ok: true; email?: string } | { ok: false; reason: string }> {
  const parts = token.split(".")
  if (parts.length !== 3) return { ok: false, reason: "malformed token" }
  const [encodedHeader, encodedPayload, signature] = parts

  let header: { alg?: string; kid?: string }
  let payload: { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string }
  try {
    header = decodeSegment(encodedHeader)
    payload = decodeSegment(encodedPayload)
  } catch {
    return { ok: false, reason: "malformed token" }
  }
  if (header.alg !== "RS256" || !header.kid) return { ok: false, reason: "unsupported token" }

  let jwk = (await getCerts()).find((key) => key.kid === header.kid)
  if (!jwk) jwk = (await getCerts(true)).find((key) => key.kid === header.kid)
  if (!jwk) return { ok: false, reason: "unknown signing key" }

  const verifier = createVerify("RSA-SHA256")
  verifier.update(`${encodedHeader}.${encodedPayload}`)
  const publicKey = createPublicKey({ key: jwk, format: "jwk" })
  if (!verifier.verify(publicKey, Buffer.from(signature, "base64url"))) return { ok: false, reason: "invalid signature" }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audiences.includes(AUDIENCE)) return { ok: false, reason: "invalid audience" }
  if (payload.iss !== `https://${TEAM_DOMAIN}`) return { ok: false, reason: "invalid issuer" }
  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < now) return { ok: false, reason: "token expired" }
  if (payload.nbf && payload.nbf > now + 60) return { ok: false, reason: "token not yet valid" }

  return { ok: true, email: payload.email }
}

// 認証 OK なら null、NG ならそのまま返せる 401 レスポンスを返す
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== "production" && process.env.ADMIN_AUTH_DISABLED === "1") return null

  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ ok: false, message: "管理者ログインが必要です。" }, { status: 401 })
  }
  try {
    const result = await verifyAccessJwt(token)
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: "管理者ログインが無効です。再読み込みしてください。" }, { status: 401 })
    }
  } catch (error) {
    console.error("Failed to verify Cloudflare Access token:", error)
    return NextResponse.json({ ok: false, message: "管理者認証に失敗しました。" }, { status: 500 })
  }
  return null
}
