"use client"

import { useEffect, useMemo, useState } from "react"
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns"
import { ja } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { bookingSchema, type BookingInput } from "@/lib/booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"

const fallbackSlots = Array.from({ length: 14 }, (_, idx) => `${String(10 + idx).padStart(2, "0")}:00`)

export default function AppointPage() {
  const [serverMessage, setServerMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [disabledDateKeys, setDisabledDateKeys] = useState<Set<string>>(new Set())

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: "meet",
      timeSlot: "",
    },
  })

  const bookingType = watch("bookingType")
  const showLocation = useMemo(() => bookingType === "対面", [bookingType])

  useEffect(() => {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
      (date) => date >= todayStart
    )

    const fetchMonthlyAvailability = async () => {
      try {
        const checks = await Promise.all(
          monthDays.map(async (date) => {
            const dateStr = format(date, "yyyy-MM-dd")
            const response = await fetch(`/api/bookings?date=${dateStr}&bookingType=${encodeURIComponent(bookingType)}`)
            const json = await response.json().catch(() => ({ ok: false, slots: [] }))
            const isAvailable = !response.ok || !json.ok
              ? true
              : Array.isArray(json.slots) && json.slots.length > 0
            return { dateStr, isAvailable }
          })
        )

        setDisabledDateKeys(
          new Set(checks.filter((item) => !item.isAvailable).map((item) => item.dateStr))
        )
      } catch {
        setDisabledDateKeys(new Set())
      }
    }

    fetchMonthlyAvailability()
  }, [calendarMonth, bookingType])

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([])
      return
    }

    const fetchAvailability = async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      setLoadingSlots(true)
      try {
        const response = await fetch(`/api/bookings?date=${dateStr}&bookingType=${encodeURIComponent(bookingType)}`)
        const json = await response.json()
        if (response.ok && json.ok && Array.isArray(json.slots)) {
          setAvailableSlots(json.slots)
        } else {
          setAvailableSlots(fallbackSlots)
        }
      } catch {
        setAvailableSlots(fallbackSlots)
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailability()
  }, [selectedDate, bookingType])

  const onSubmit = async (values: BookingInput) => {
    setSubmitting(true)
    setServerMessage("")
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      setServerMessage(result.message || "送信が完了しました。")
      if (result.ok) {
        reset({ bookingType: values.bookingType, timeSlot: "" })
        setSelectedDate(undefined)
      }
    } catch {
      setServerMessage("通信エラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-4xl px-4 py-24">
        <h1 className="text-3xl font-bold">予約ページ</h1>
        <p className="mt-2 text-slate-300">
          1か月カレンダーから日付を選択すると、当日の空き時間帯を表示します。現時点では API モックで受け付けます。
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="name">お名前</Label>
              <Input id="name" {...register("name")} className="mt-2" />
              {errors.name && <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" {...register("email")} className="mt-2" />
              {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="company">会社名（任意）</Label>
            <Input id="company" {...register("company")} className="mt-2" />
          </div>

          <div>
            <Label>予約タイプ</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 p-3">
                <input type="radio" value="meet" {...register("bookingType")} />
                <span>meet</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 p-3">
                <input type="radio" value="対面" {...register("bookingType")} />
                <span>対面</span>
              </label>
            </div>
            {errors.bookingType && <p className="mt-1 text-sm text-red-300">{errors.bookingType.message}</p>}
          </div>

          {showLocation && (
            <div>
              <Label htmlFor="location">場所（対面必須）</Label>
              <Input id="location" placeholder="例: 渋谷駅周辺 / 御社オフィス" {...register("location")} className="mt-2" />
              {errors.location && <p className="mt-1 text-sm text-red-300">{errors.location.message}</p>}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-700 p-3">
              <Label>日付選択（1か月）</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={(date) => {
                  setSelectedDate(date)
                  setValue("timeSlot", "")
                  setValue("date", date ? format(date, "yyyy-MM-dd") : "")
                }}
                locale={ja}
                disabled={(date) => {
                  const today = new Date(new Date().setHours(0, 0, 0, 0))
                  if (date < today) return true
                  const key = format(date, "yyyy-MM-dd")
                  return disabledDateKeys.has(key)
                }}
                className="mt-2"
              />
              <input type="hidden" {...register("date")} />
              {errors.date && <p className="mt-1 text-sm text-red-300">{errors.date.message}</p>}
            </div>

            <div className="rounded-lg border border-slate-700 p-3">
              <Label>空き時間帯</Label>
              {selectedDate ? (
                <>
                  <p className="mt-2 text-sm text-slate-400">
                    {format(selectedDate, "yyyy年MM月dd日(E)", { locale: ja })} の空き枠
                  </p>
                  {loadingSlots ? (
                    <p className="mt-3 text-sm text-slate-400">空き時間を照会中...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {availableSlots.map((slot) => (
                        <label key={slot} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 p-2">
                          <input type="radio" value={slot} {...register("timeSlot")} />
                          <span>{slot}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-amber-300">この日は空き時間がありません。</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">先に日付を選択してください。</p>
              )}
              {errors.timeSlot && <p className="mt-2 text-sm text-red-300">{errors.timeSlot.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="agenda">相談内容</Label>
            <Textarea id="agenda" rows={5} {...register("agenda")} className="mt-2" />
            {errors.agenda && <p className="mt-1 text-sm text-red-300">{errors.agenda.message}</p>}
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "送信中..." : "予約リクエストを送信"}
          </Button>

          {serverMessage && <p className="rounded-md bg-slate-800 p-3 text-sm">{serverMessage}</p>}
        </form>
      </section>
    </main>
  )
}
