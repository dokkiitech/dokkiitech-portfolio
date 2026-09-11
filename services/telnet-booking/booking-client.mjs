const DEFAULT_TIMEOUT_MS = 15_000

function resolveApiBaseUrl(value) {
  const url = new URL(value)
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
  const allowInsecure = process.env.TELNET_ALLOW_INSECURE_API === "true"

  if (url.protocol !== "https:" && !isLocal && !allowInsecure) {
    throw new Error("BOOKING_API_BASE_URL must use HTTPS")
  }

  return url
}

export class BookingClient {
  constructor({
    baseUrl = process.env.BOOKING_API_BASE_URL || "https://www.dokkiitech.com",
    timeoutMs = Number(process.env.TELNET_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    fetchImpl = fetch,
  } = {}) {
    this.baseUrl = resolveApiBaseUrl(baseUrl)
    this.timeoutMs = timeoutMs
    this.fetchImpl = fetchImpl
  }

  async request(path, init) {
    const response = await this.fetchImpl(new URL(path, this.baseUrl), {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok || !body.ok) {
      throw new Error(typeof body.message === "string" ? body.message : "予約APIへの接続に失敗しました。")
    }

    return body
  }

  getAvailability(date, bookingType) {
    const query = new URLSearchParams({ date, bookingType })
    return this.request(`/api/bookings?${query.toString()}`)
  }

  createBooking(payload) {
    return this.request("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  }
}
