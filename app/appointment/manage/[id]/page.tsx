"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { BookingCompletionScreen } from "@/components/booking-completion-screen"

interface ManageRecord {
  id: string
  name: string
  email: string
  company?: string | null
  bookingType: "meet" | "対面"
  date: string
  timeSlot: string
  location?: string | null
  agenda: string
  status: string
  expiresAt: string
  passwordSet: boolean
}

type Step = "loading" | "set-password" | "login" | "manage" | "error"

function formatSlotRange(slot: string): string {
  const start = new Date(`2000-01-01T${slot}:00+09:00`)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const endText = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
  return `${slot} - ${endText}`
}

function buildFallbackSlots(date: string, bookingType: "meet" | "対面"): string[] {
  const threshold = bookingType === "meet" ? Date.now() + 60 * 60 * 1000 : Date.now()
  return Array.from({ length: 14 }, (_, idx) => `${String(10 + idx).padStart(2, "0")}:00`).filter((slot) => {
    const slotStart = new Date(`${date}T${slot}:00+09:00`)
    return slotStart.getTime() > threshold
  })
}

export default function ManageBookingPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const search = useSearchParams()
  const token = search.get("token") || ""

  const [step, setStep] = useState<Step>("loading")
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [record, setRecord] = useState<ManageRecord | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [actionLoading, setActionLoading] = useState<"update" | "cancel" | null>(null)
  const [completion, setCompletion] = useState<{
    title: string
    description: string
    detail?: string
    infoLines?: string[]
    actionLabel: string
    action: "back" | "home"
  } | null>(null)
  const [form, setForm] = useState({
    date: "",
    timeSlot: "",
    location: "",
    company: "",
    agenda: "",
  })

  const showLocation = useMemo(() => record?.bookingType === "対面", [record?.bookingType])

  const verify = async (inputPassword?: string) => {
    const response = await fetch(`/api/bookings/manage/${params.id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: inputPassword }),
    })
    const json = await response.json()
    if (!response.ok || !json.ok) return { ok: false, message: json.message as string }
    return { ok: true, record: json.record as ManageRecord }
  }

  useEffect(() => {
    if (!token) {
      setStep("error")
      setMessage("トークンがありません。予約完了メールのURLからアクセスしてください。")
      return
    }

    const bootstrap = async () => {
      const checked = await verify()
      if (checked.ok && checked.record) {
        setStep(checked.record.passwordSet ? "login" : "set-password")
        return
      }
      if (checked.message?.includes("パスワードを入力")) {
        setStep("login")
      } else {
        setStep("error")
        setMessage(checked.message || "予約管理ページにアクセスできません。")
      }
    }

    bootstrap()
  }, [token, params.id])

  const loadAvailability = async (dateStr: string, currentTimeSlot?: string) => {
    setLoadingSlots(true)
    try {
      const response = await fetch(`/api/bookings?date=${dateStr}&bookingType=${encodeURIComponent(record?.bookingType || "meet")}`)
      const json = await response.json()
      const fromApi = response.ok && json.ok && Array.isArray(json.slots)
        ? (json.slots as string[])
        : buildFallbackSlots(dateStr, record?.bookingType || "meet")
      const merged = currentTimeSlot && !fromApi.includes(currentTimeSlot) ? [currentTimeSlot, ...fromApi] : fromApi
      setAvailableSlots(Array.from(new Set(merged)))
    } catch {
      const fallback = buildFallbackSlots(dateStr, record?.bookingType || "meet")
      const merged = currentTimeSlot && !fallback.includes(currentTimeSlot) ? [currentTimeSlot, ...fallback] : fallback
      setAvailableSlots(Array.from(new Set(merged)))
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    if (!selectedDate || step !== "manage") return
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    setForm((prev) => ({ ...prev, date: dateStr, timeSlot: "" }))
    void loadAvailability(dateStr, record?.timeSlot)
  }, [selectedDate, step, record?.timeSlot])

  const onLogin = async () => {
    const checked = await verify(password)
    if (!checked.ok || !checked.record) {
      setMessage(checked.message || "認証に失敗しました。")
      return
    }

    setRecord(checked.record)
    setSelectedDate(new Date(`${checked.record.date}T00:00:00+09:00`))
    setForm({
      date: checked.record.date,
      timeSlot: checked.record.timeSlot,
      location: checked.record.location || "",
      company: checked.record.company || "",
      agenda: checked.record.agenda,
    })
    await loadAvailability(checked.record.date, checked.record.timeSlot)
    setStep("manage")
    setMessage("")
  }

  const onSetPassword = async () => {
    const response = await fetch(`/api/bookings/manage/${params.id}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: newPassword }),
    })
    const json = await response.json()
    if (!response.ok || !json.ok) {
      setMessage(json.message || "パスワード設定に失敗しました。")
      return
    }
    setPassword(newPassword)
    await onLogin()
  }

  const onUpdate = async () => {
    setActionLoading("update")
    try {
      const response = await fetch(`/api/bookings/manage/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          date: form.date,
          timeSlot: form.timeSlot,
          bookingType: record?.bookingType,
          location: form.location,
          company: form.company,
          agenda: form.agenda,
        }),
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        const nextRecord = json.record as
          | { booking_type?: "meet" | "対面"; date?: string; time_slot?: string; location?: string | null }
          | undefined
        const bookingType = nextRecord?.booking_type || record?.bookingType || "meet"
        const date = nextRecord?.date || form.date
        const timeSlot = nextRecord?.time_slot || form.timeSlot
        const location = nextRecord?.location || form.location
        setCompletion({
          title: "予約変更完了",
          detail: `${date} ${timeSlot}`,
          infoLines: [
            `日程: ${date}`,
            `時間: ${timeSlot}`,
            `形式: ${bookingType === "meet" ? "Google Meet" : "対面"}`,
            ...(bookingType === "対面" ? [`場所: ${location || "-"}`] : []),
          ],
          description: "予約内容を更新しました。確認メールをご確認ください。",
          actionLabel: "専用ページに戻る",
          action: "back",
        })
        setMessage("")
        return
      }
      setMessage([json.message, json.error].filter(Boolean).join("\n"))
    } finally {
      setActionLoading(null)
    }
  }

  const onCancel = async () => {
    setActionLoading("cancel")
    try {
      const response = await fetch(`/api/bookings/manage/${params.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        const bookingType = record?.bookingType || "meet"
        setCompletion({
          title: "予約キャンセル完了",
          detail: `${form.date} ${form.timeSlot}`,
          infoLines: [
            `日程: ${form.date}`,
            `時間: ${form.timeSlot}`,
            `形式: ${bookingType === "meet" ? "Google Meet" : "対面"}`,
            ...(bookingType === "対面" ? [`場所: ${form.location || "-"}`] : []),
          ],
          description: "ご予約をキャンセルしました。確認メールをご確認ください。",
          actionLabel: "ホームに戻る",
          action: "home",
        })
        setMessage("")
        return
      }
      setMessage([json.message, json.error].filter(Boolean).join("\n"))
    } finally {
      setActionLoading(null)
    }
  }

  if (completion) {
    return (
      <BookingCompletionScreen
        title={completion.title}
        detail={completion.detail}
        infoLines={completion.infoLines}
        description={completion.description}
        actionLabel={completion.actionLabel}
        onAction={() => {
          if (completion.action === "home") {
            router.push("/")
            return
          }
          setCompletion(null)
          setMessage("")
        }}
      />
    )
  }

  if (actionLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <h1 className="mt-6 text-3xl font-bold">{actionLoading === "update" ? "予約変更中..." : "キャンセル中..."}</h1>
          <p className="mt-2 text-sm text-muted-foreground">しばらくお待ちください。</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-4 py-24">
        <h1 className="text-3xl font-bold">予約者専用ページ</h1>
        <p className="mt-2 text-muted-foreground">このページは予約日 23:59 まで有効です。</p>

        {step === "loading" && <p className="mt-8">読み込み中...</p>}

        {step === "set-password" && (
          <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            <Label htmlFor="newPassword">専用ページ用パスワードを設定（4文字以上）</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Button onClick={onSetPassword}>パスワードを設定してログイン</Button>
          </div>
        )}

        {step === "login" && (
          <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button onClick={onLogin}>ログイン</Button>
          </div>
        )}

        {step === "manage" && record && (
          <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">対象: {record.name} / {record.email}</p>

            <div>
              <Label>予約タイプ（変更不可）</Label>
              <Input value={record.bookingType} readOnly />
            </div>

            <div className="rounded-lg border border-border p-3">
              <Label>日付選択</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ja}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="mt-2"
              />
            </div>

            <div className="rounded-lg border border-border p-3">
              <Label>時間帯選択</Label>
              {loadingSlots ? (
                <p className="mt-2 text-sm text-muted-foreground">空き時間を照会中...</p>
              ) : availableSlots.length > 0 ? (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {availableSlots.map((slot) => (
                    <label key={slot} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2">
                      <input
                        type="radio"
                        name="manage-time-slot"
                        checked={form.timeSlot === slot}
                        onChange={() => setForm((prev) => ({ ...prev, timeSlot: slot }))}
                      />
                      <span>{formatSlotRange(slot)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">選択日の空き時間がありません。</p>
              )}
            </div>

            {showLocation && (
              <div>
                <Label>場所（対面時）</Label>
                <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
              </div>
            )}

            <div>
              <Label>会社名（任意）</Label>
              <Input value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} />
            </div>
            <div>
              <Label>相談内容</Label>
              <Textarea value={form.agenda} onChange={(e) => setForm((prev) => ({ ...prev, agenda: e.target.value }))} />
            </div>

            <div className="flex gap-3">
              <Button onClick={onUpdate} disabled={!form.date || !form.timeSlot || actionLoading !== null}>
                予約を変更
              </Button>
              <Button variant="destructive" onClick={onCancel} disabled={actionLoading !== null}>
                予約をキャンセル
              </Button>
            </div>
          </div>
        )}

        {step === "error" && <p className="mt-8 text-red-500">{message}</p>}
        {message && step !== "error" && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{message}</p>}
      </section>
    </main>
  )
}
