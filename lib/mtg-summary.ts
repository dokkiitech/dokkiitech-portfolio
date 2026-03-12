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

function formatDbStatusLine(status: string, detail?: string) {
  return detail ? `${status}\n${detail}` : status
}

function truncateField(value: string, max = 1000) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function resolveEmbedColor(status: string) {
  if (status === "Supabase 取得成功") return 0x22c55e
  if (status === "Supabase 未照会") return 0xf59e0b
  return 0xef4444
}

async function fetchMeetings(date: string) {
  return listBookingPortals({ date, status: "active" })
}

export async function runMtgSummary() {
  const today = getJstToday()
  const tomorrow = addDays(today, 1)

  let todayMeetings: BookingPortalRecord[] = []
  let tomorrowMeetings: BookingPortalRecord[] = []
  let dbStatus = "Supabase 未照会"
  let dbDetail = "Supabase の環境変数が未設定、または照会前に失敗しました。"

  try {
    ;[todayMeetings, tomorrowMeetings] = await Promise.all([fetchMeetings(today), fetchMeetings(tomorrow)])
    dbStatus = "Supabase 取得成功"
    dbDetail = `today=${todayMeetings.length}件 / tomorrow=${tomorrowMeetings.length}件`
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Supabase env missing")) {
        dbStatus = "Supabase 未照会"
        dbDetail = error.message
      } else {
        dbStatus = "Supabase 取得失敗"
        dbDetail = error.message
      }
    } else {
      dbStatus = "Supabase 取得失敗"
      dbDetail = "不明なエラーが発生しました。"
    }
  }

  const todaySection = buildSection("今日のMTG", todayMeetings)
  const tomorrowSection = buildSection("明日のMTG", tomorrowMeetings)
  const dbSection = formatDbStatusLine(dbStatus, dbDetail)

  const notifyResult = await sendDiscordConciergePayloadNotification({
    username: "コンシェルジュ",
    content: "本日の MTG デイリーサマリーです。",
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: "MTGデイリーサマリー",
        description: `対象日: ${today} / ${tomorrow}`,
        color: resolveEmbedColor(dbStatus),
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
          {
            name: "DBアクセス状況",
            value: truncateField(dbSection),
            inline: false,
          },
        ],
        footer: {
          text: "DOKKIITECH Concierge",
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
    dbStatus,
    detail: notifyResult.sent ? undefined : notifyResult.reason,
    todayCount: todayMeetings.length,
    tomorrowCount: tomorrowMeetings.length,
  }
}
