import { listBookingPortals, type BookingPortalRecord } from "@/lib/booking-portal"
import { sendDiscordConciergePayloadNotification } from "@/lib/discord-concierge"

const JST_TIME_ZONE = "Asia/Tokyo"

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error(`Failed to format date in time zone: ${timeZone}`)
  }

  return { year, month, day }
}

function getJstToday() {
  const { year, month, day } = getDatePartsInTimeZone(new Date(), JST_TIME_ZONE)
  return `${year}-${month}-${day}`
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number)
  const base = new Date(Date.UTC(year, month - 1, day))
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

function formatBookingLine(record: BookingPortalRecord) {
  const bookingType = record.booking_type === "meet" ? "Google Meet" : `対面${record.location ? ` (${record.location})` : ""}`
  const company = record.company ? ` / ${record.company}` : ""
  return `- ${record.time_slot} ${record.name}${company} / ${bookingType}`
}

function buildSection(title: string, records: BookingPortalRecord[]) {
  if (records.length === 0) {
    return `${title}\nなし`
  }

  const lines = [...records]
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot) || a.created_at.localeCompare(b.created_at))
    .map(formatBookingLine)

  return `${title}\n${lines.join("\n")}`
}

function truncateField(value: string, max = 1000) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

async function fetchMeetings(date: string) {
  return listBookingPortals({ date, status: "active" })
}

export async function runMtgSummary() {
  const today = getJstToday()
  const tomorrow = addDays(today, 1)

  let todayMeetings: BookingPortalRecord[] = []
  let tomorrowMeetings: BookingPortalRecord[] = []

  try {
    ;[todayMeetings, tomorrowMeetings] = await Promise.all([fetchMeetings(today), fetchMeetings(tomorrow)])
  } catch (error) {
    // 取得失敗は Discord に流さず cron のレスポンス(500)で検知する
    return {
      ok: false,
      message: "予約の取得に失敗しました。",
      today,
      tomorrow,
      detail: error instanceof Error ? error.message : String(error),
    }
  }

  // 今日・明日ともに予約が無い日は通知しない
  if (todayMeetings.length === 0 && tomorrowMeetings.length === 0) {
    return {
      ok: true,
      skipped: true,
      message: "今日・明日の予約が0件のため通知をスキップしました。",
      today,
      tomorrow,
      todayCount: 0,
      tomorrowCount: 0,
    }
  }

  const todaySection = buildSection("今日のMTG", todayMeetings)
  const tomorrowSection = buildSection("明日のMTG", tomorrowMeetings)

  // 名前・アイコンは Discord 側の webhook 設定を使うため username は指定しない
  const notifyResult = await sendDiscordConciergePayloadNotification({
    content: "おはよう、わがこよ。きょうの よていを おしらせ しますね。",
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: "きょうと あしたの MTG ですよ",
        description: `対象日: ${today} / ${tomorrow}`,
        color: 0xc4b5fd,
        fields: [
          {
            name: `今日のMTG (${todayMeetings.length}件)`,
            value: truncateField(todaySection.replace(/^今日のMTG\n/, "")),
            inline: false,
          },
          {
            name: `明日のMTG (${tomorrowMeetings.length}件)`,
            value: truncateField(tomorrowSection.replace(/^明日のMTG\n/, "")),
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

  return {
    ok: notifyResult.sent,
    message: notifyResult.sent ? "MTG サマリーを送信しました。" : "Discord への送信に失敗しました。",
    today,
    tomorrow,
    detail: notifyResult.sent ? undefined : notifyResult.reason,
    todayCount: todayMeetings.length,
    tomorrowCount: tomorrowMeetings.length,
  }
}
