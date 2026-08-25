type ConciergeNotificationKind = "created" | "updated" | "canceled"
type ConciergeWebhookPayload = Record<string, unknown>

interface ConciergeBookingPayload {
  bookingId: string
  name: string
  email: string
  company?: string | null
  bookingType: "meet" | "対面"
  date: string
  timeSlot: string
  agenda: string
  location?: string | null
  status: string
  meetUrl?: string | null
  calendarEventUrl?: string | null
}

function getWebhookUrl(): string | null {
  return process.env.DISCORD_CONCIERGE_WEBHOOK_URL || null
}

async function postWebhook(body: ConciergeWebhookPayload) {
  const webhookUrl = getWebhookUrl()
  if (!webhookUrl) {
    return { sent: false, reason: "DISCORD_CONCIERGE_WEBHOOK_URL missing" }
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    return { sent: false, reason: await response.text() }
  }

  return { sent: true }
}

function getAdminUrl(): string | null {
  const base =
    process.env.BOOKING_ADMIN_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.BOOKING_PORTAL_BASE_URL
  if (!base) return null
  return `${base.replace(/\/$/, "")}/appointment/admin`
}

function truncate(value: string, max = 280): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function buildMessage(kind: ConciergeNotificationKind) {
  if (kind === "created") {
    return {
      title: "あたらしい ごよやくが はいりましたよ",
      description:
        "トリエルです。あたらしいおうちあわせの ごよやくが とどいていますよ。あわてなくても だいじょうぶ。バタースコッチパイでもたべながら ゆっくりかくにんしてちょうだい。",
      color: 0x7dd3fc,
    }
  }

  if (kind === "updated") {
    return {
      title: "ごよやくの ないようが かわりましたよ",
      description:
        "トリエルです。ごよやくのないようが すこしかわったみたいですよ。\nまちがいがないか いちど かくにんしてみるのも いいんじゃないかしら？",
      color: 0xfbbf24,
    }
  }

  return {
    title: "ごよやくが キャンセルに なりました",
    description:
      "トリエルです。ざんねんですが、ごよやくのキャンセルをうけつけました。\nこういうことだって たまには あるものよ。“ガーン”とせずに、“ガンガン”いかなきゃね！",
    color: 0xfb7185,
  }
}

export async function sendDiscordConciergeNotification(
  kind: ConciergeNotificationKind,
  booking: ConciergeBookingPayload
) {
  const adminUrl = getAdminUrl()
  const theme = buildMessage(kind)
  const formatLine = booking.bookingType === "meet" ? "Google Meet" : `対面${booking.location ? ` / ${booking.location}` : ""}`
  const guestLabel = booking.company ? `${booking.company}\n${booking.name}` : booking.name

  // 名前・アイコンは Discord 側の webhook 設定を使うため username は指定しない
  return postWebhook({
    content: "あら、あなたに おしらせが とどいていますよ。",
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: theme.title,
        description: theme.description,
        color: theme.color,
        fields: [
          { name: "予約番号", value: `\`${booking.bookingId}\``, inline: true },
          { name: "ステータス", value: booking.status, inline: true },
          { name: "方式", value: formatLine, inline: true },
          { name: "予約者", value: guestLabel, inline: true },
          { name: "メール", value: booking.email, inline: true },
          { name: "日時", value: `${booking.date} ${booking.timeSlot}`, inline: true },
          { name: "ご相談内容", value: truncate(booking.agenda) || "-", inline: false },
          {
            name: "管理画面",
            value: adminUrl ? `[予約管理ページを開く](${adminUrl})` : "BOOKING_ADMIN_BASE_URL または NEXT_PUBLIC_SITE_URL を設定するとリンクを表示できます。",
            inline: false,
          },
          {
            name: "関連リンク",
            value:
              booking.meetUrl || booking.calendarEventUrl
                ? [booking.meetUrl ? `[Meet](${booking.meetUrl})` : null, booking.calendarEventUrl ? `[Calendar](${booking.calendarEventUrl})` : null]
                    .filter(Boolean)
                    .join(" / ")
                : "なし",
            inline: false,
          },
        ],
        footer: {
          text: "トリエル | DOKKIITECH",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  })
}

export async function sendDiscordConciergeTextNotification(content: string) {
  return postWebhook({
    content,
    allowed_mentions: { parse: [] },
  })
}

export async function sendDiscordConciergePayloadNotification(payload: ConciergeWebhookPayload) {
  return postWebhook(payload)
}
