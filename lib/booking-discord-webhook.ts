type BookingWebhookEvent = "created" | "updated" | "canceled"

interface BookingWebhookInput {
  event: BookingWebhookEvent
  reserverName: string
  date: string
  timeSlot: string
  bookingType: "meet" | "対面"
  location?: string | null
}

function toEventLabel(event: BookingWebhookEvent): string {
  switch (event) {
    case "created":
      return "予約作成"
    case "updated":
      return "予約更新"
    case "canceled":
      return "予約キャンセル"
  }
}

function maskName(name: string): string {
  const normalized = name.trim()
  if (!normalized) return "不明"
  if (normalized.length === 1) return "*"
  if (normalized.length === 2) return `${normalized[0]}*`
  return `${normalized[0]}${"*".repeat(normalized.length - 2)}${normalized[normalized.length - 1]}`
}

export async function sendBookingWebhookNotification(input: BookingWebhookInput): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL
  if (!webhookUrl) return

  const eventLabel = toEventLabel(input.event)
  const lines = [
    `イベント種別: ${eventLabel}`,
    `予約者名: ${maskName(input.reserverName)}`,
    `日時: ${input.date} ${input.timeSlot}`,
    `方式: ${input.bookingType}`,
  ]

  if (input.bookingType === "対面" && input.location?.trim()) {
    lines.push(`対面場所: ${input.location.trim()}`)
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `【予約通知】\n${lines.join("\n")}`,
      allowed_mentions: { parse: [] },
    }),
  })

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${await response.text()}`)
  }
}

export async function sendBookingWebhookNotificationSafely(input: BookingWebhookInput): Promise<void> {
  try {
    await sendBookingWebhookNotification(input)
  } catch (error) {
    console.error("Discord webhook notification failed:", error)
  }
}
