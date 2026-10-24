import {
  calcEndTime,
  checkSlotBusy,
  createGoogleAccessToken,
  DEFAULT_TIMEZONE,
  envOrThrow,
  formatDateJp,
  getMode,
  getStartEnd,
  hasAllDayBusyEvent,
  isInPersonLeadTimeInvalid,
  isMeetTooSoon,
  isPastSlot,
} from "@/lib/booking-calendar"
import {
  buildManageUrl,
  portalExpiresAt,
  rotatePortalCredentials,
  updatePortalBooking,
  type BookingPortalRecord,
} from "@/lib/booking-portal"
import { sendDiscordConciergeNotification } from "@/lib/discord-concierge"
import { sendMail } from "@/lib/mail"
import { renderBookingMail } from "@/lib/mail-template"

const UPDATE_FROM_ADDRESS = "reappointment@dokkiitech.work"

export interface RescheduleInput {
  date: string
  timeSlot: string
  location?: string | null
  agenda?: string
  company?: string | null
}

export interface RescheduleOptions {
  // customer: 予約者本人が予約管理ページから変更 / admin: 管理画面から変更
  actor: "customer" | "admin"
  // admin のみ: Google カレンダーの空き確認を省略する
  skipAvailabilityCheck?: boolean
  // admin のみ: false で予約者への変更メールを送らない
  notifyCustomer?: boolean
  // customer のみ: 予約者が使っている専用ページのトークンとパスワード（メールのボタン・記載に使う）
  manageToken?: string
  managePassword?: string
}

export type RescheduleResult =
  | { ok: true; record: BookingPortalRecord; mail: { sent: boolean; reason?: string } }
  | { ok: false; status: number; message: string; error?: string }

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
}

export function isValidTimeSlot(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export async function rescheduleBooking(
  record: BookingPortalRecord,
  input: RescheduleInput,
  options: RescheduleOptions
): Promise<RescheduleResult> {
  const isAdmin = options.actor === "admin"
  const nextDate = input.date
  const nextTimeSlot = input.timeSlot
  const nextBookingType = record.booking_type
  const nextLocation = input.location !== undefined ? String(input.location || "") : record.location
  const nextAgenda = input.agenda || record.agenda
  const nextCompany = input.company !== undefined ? String(input.company || "") : record.company

  if (!isValidDate(nextDate) || !isValidTimeSlot(nextTimeSlot)) {
    return { ok: false, status: 400, message: "日付または時刻の形式が正しくありません。" }
  }

  if (nextDate === record.date && nextTimeSlot === record.time_slot) {
    return { ok: false, status: 400, message: "現在と同じ日時には変更できません。別の時間を選択してください。" }
  }

  if (isPastSlot(nextDate, nextTimeSlot)) {
    return { ok: false, status: 400, message: "過去の時間帯は予約できません。未来の時間を選択してください。" }
  }
  // 管理者は Meet 1時間前 / 対面 2日前 の受付ルールに縛られない
  if (!isAdmin && nextBookingType === "meet" && isMeetTooSoon(nextDate, nextTimeSlot)) {
    return { ok: false, status: 400, message: "Meet予約は1時間後以降の時間帯を選択してください。" }
  }
  if (!isAdmin && isInPersonLeadTimeInvalid(nextBookingType, nextDate)) {
    return { ok: false, status: 400, message: "対面の予約は2日前から可能です。別の日付を選択してください。" }
  }

  let calendarEventUrl = record.calendar_event_url
  let meetUrl = record.meet_url

  if (getMode() === "gcp" && record.calendar_event_id) {
    const calendarId = envOrThrow("GOOGLE_CALENDAR_CALENDAR_ID")
    const accessToken = await createGoogleAccessToken()
    const skipAvailabilityCheck = isAdmin && options.skipAvailabilityCheck
    if (!skipAvailabilityCheck) {
      const allDayBusy = await hasAllDayBusyEvent(accessToken, calendarId, nextDate)
      if (allDayBusy) {
        return {
          ok: false,
          status: 409,
          message: "この日は終日予定が入っているため予約できません。別の日付を選択してください。",
        }
      }
      const busy = await checkSlotBusy(accessToken, calendarId, nextDate, nextTimeSlot)
      if (busy) {
        return { ok: false, status: 409, message: "選択した時間帯は空いていません。別の時間を選択してください。" }
      }
    }
    const { startDateTime, endDateTime } = getStartEnd(nextDate, nextTimeSlot)
    const sendUpdates = isAdmin && options.notifyCustomer === false ? "none" : "all"

    const patchResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(
        record.calendar_event_id
      )}?sendUpdates=${sendUpdates}&conferenceDataVersion=1`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `打ち合わせ: ${record.name}`,
          description: `予約タイプ: ${nextBookingType}\n会社名: ${nextCompany || "-"}\n相談内容: ${nextAgenda}\n申込者メール: ${record.email}`,
          location: nextBookingType === "対面" ? nextLocation : undefined,
          start: { dateTime: startDateTime, timeZone: DEFAULT_TIMEZONE },
          end: { dateTime: endDateTime, timeZone: DEFAULT_TIMEZONE },
          attendees: [{ email: record.email }],
          conferenceData:
            nextBookingType === "meet" ? { createRequest: { requestId: `meet-update-${Date.now()}` } } : undefined,
        }),
      }
    )

    if (!patchResponse.ok) {
      return {
        ok: false,
        status: 502,
        message: "Google Calendar の予約更新に失敗しました。",
        error: await patchResponse.text(),
      }
    }

    const patched = (await patchResponse.json()) as { htmlLink?: string; hangoutLink?: string }
    calendarEventUrl = patched.htmlLink || calendarEventUrl
    meetUrl = patched.hangoutLink || meetUrl
  }

  const updated = await updatePortalBooking(record.id, {
    date: nextDate,
    time_slot: nextTimeSlot,
    booking_type: nextBookingType,
    location: nextLocation,
    agenda: nextAgenda,
    company: nextCompany,
    calendar_event_url: calendarEventUrl || null,
    meet_url: meetUrl || null,
    expires_at: portalExpiresAt(nextDate),
  })

  let mail: { sent: boolean; reason?: string } = { sent: false, reason: "notification disabled" }
  if (!isAdmin || options.notifyCustomer !== false) {
    const dateJp = formatDateJp(nextDate)
    const endTime = calcEndTime(nextTimeSlot)
    const salutation = `${nextCompany ? `${nextCompany} ` : ""}${record.name}さま`
    const formatLine = nextBookingType === "meet" ? "Google Meet" : `対面（${nextLocation || "-"}）`
    // トークン・パスワードはハッシュしか持っていないので、管理者変更時は再発行して新しいものを送る
    const credentials = isAdmin
      ? await rotatePortalCredentials(record.id)
      : options.manageToken
        ? { token: options.manageToken, password: options.managePassword || "" }
        : null
    const manageButton = credentials
      ? { button: { label: "予約者専用ページを開く", href: buildManageUrl(record.id, credentials.token) } }
      : {}
    const passwordRow = credentials?.password ? [{ label: "パスワード", value: credentials.password }] : []
    const dateChanged = nextDate !== record.date
    const timeChanged = nextTimeSlot !== record.time_slot
    mail = await sendMail(
      record.email,
      isAdmin ? "【重要】ご予約日時変更のお知らせ" : "予約変更のお知らせ",
      renderBookingMail(
        isAdmin
          ? {
              badge: "日時変更のお知らせ",
              title: "ご予約の日時が変更されました",
              salutation,
              paragraphs: [
                "いつもありがとうございます。dokkiitech です。",
                "ご予約いただいていたお打ち合わせについて、こちらの都合により日時を変更させていただきました。ご迷惑をおかけし申し訳ございません。",
              ],
              notice: "この変更は、dokkiitech の予約管理者によって行われました。",
              ...manageButton,
              rows: [
                { label: "予約番号", value: record.booking_id },
                { label: "日程", value: dateJp, ...(dateChanged ? { before: formatDateJp(record.date) } : {}) },
                {
                  label: "時刻",
                  value: `${nextTimeSlot} - ${endTime}`,
                  ...(timeChanged ? { before: `${record.time_slot} - ${calcEndTime(record.time_slot)}` } : {}),
                },
                { label: "形式", value: formatLine },
                ...(meetUrl ? [{ label: "Meet URL", value: meetUrl, href: meetUrl }] : []),
                ...passwordRow,
              ],
              closing: [
                "Googleカレンダーの予定にも変更内容が反映されます。",
                "ご都合が合わない場合は、予約者専用ページから日時を変更いただくか、info@dokkiitech.com までご連絡ください。",
                "予約者専用ページのリンクとパスワードを新しくしました。以前のメールのリンク・パスワードは使えなくなりましたので、こちらのボタンと上記のパスワードでアクセスしてください。",
                "引き続きどうぞよろしくお願い致します。",
              ],
            }
          : {
              badge: "予約変更",
              title: "ご予約内容を変更しました",
              salutation,
              paragraphs: ["お打ち合わせの予約内容を変更しました。下記の内容で更新されました。"],
              ...manageButton,
              rows: [
                { label: "予約番号", value: record.booking_id },
                { label: "日程", value: dateJp, ...(dateChanged ? { before: formatDateJp(record.date) } : {}) },
                {
                  label: "時刻",
                  value: `${nextTimeSlot} - ${endTime}`,
                  ...(timeChanged ? { before: `${record.time_slot} - ${calcEndTime(record.time_slot)}` } : {}),
                },
                { label: "形式", value: formatLine },
                ...(meetUrl ? [{ label: "Meet URL", value: meetUrl, href: meetUrl }] : []),
                ...passwordRow,
              ],
              closing: [
                "Googleカレンダーの予定にも変更内容が反映されます。",
                "予約者専用ページから、再度の変更やキャンセルができます。",
                "当日はどうぞよろしくお願い致します。",
              ],
            }
      ),
      "dokkiitech予約管理システム予約変更センター",
      UPDATE_FROM_ADDRESS
    )
  }

  const discord = await sendDiscordConciergeNotification("updated", {
    bookingId: record.booking_id,
    name: record.name,
    email: record.email,
    company: nextCompany,
    bookingType: nextBookingType,
    date: nextDate,
    timeSlot: nextTimeSlot,
    agenda: nextAgenda,
    location: nextLocation,
    status: isAdmin ? "予約変更（管理画面）" : "予約変更",
    meetUrl,
    calendarEventUrl,
  }).catch((error) => ({ sent: false, reason: String(error) }))
  if (!discord.sent) {
    console.error("Failed to send Discord concierge notification (update):", discord.reason)
  }

  return { ok: true, record: updated, mail }
}
