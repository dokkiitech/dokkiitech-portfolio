import { listBookingPortals, type BookingPortalRecord } from "@/lib/booking-portal"
import { sendDiscordConciergeTextNotification } from "@/lib/discord-concierge"

const JST_OFFSET = "+09:00"
const JST_TIME_ZONE = "Asia/Tokyo"

function getJstToday() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  return formatter.format(new Date())
}

function addDays(date: string, days: number) {
  const base = new Date(`${date}T00:00:00${JST_OFFSET}`)
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

  const content = [
    "MTGデイリーサマリー",
    `対象日: ${today} / ${tomorrow}`,
    "",
    buildSection("今日のMTG", todayMeetings),
    "",
    buildSection("明日のMTG", tomorrowMeetings),
    "",
    `DBアクセス状況\n${formatDbStatusLine(dbStatus, dbDetail)}`,
  ].join("\n")

  const notifyResult = await sendDiscordConciergeTextNotification(content)

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
