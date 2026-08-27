"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns"
import { ja } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  User,
  Video,
} from "lucide-react"
import { bookingSchema, type BookingInput } from "@/lib/booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { BookingCompletionScreen } from "@/components/booking-completion-screen"
import { cn } from "@/lib/utils"

type StepId = "type" | "date" | "slot" | "profile" | "agenda" | "confirm"

const STEPS: {
  id: StepId
  label: string
  icon: typeof Video
  heading: string
  description: string
}[] = [
  {
    id: "type",
    label: "形式",
    icon: Video,
    heading: "打ち合わせの形式",
    description: "オンライン（Google Meet）か対面かを選択してください。",
  },
  {
    id: "date",
    label: "日付",
    icon: CalendarDays,
    heading: "希望日を選択",
    description: "空きがない日はカレンダー上で選択できません。",
  },
  {
    id: "slot",
    label: "時間",
    icon: Clock,
    heading: "時間帯を選択",
    description: "1枠60分でお受けしています。",
  },
  {
    id: "profile",
    label: "連絡先",
    icon: User,
    heading: "お客様情報",
    description: "確認メールとカレンダー招待の送付先になります。",
  },
  {
    id: "agenda",
    label: "内容",
    icon: MessageSquare,
    heading: "相談内容",
    description: "当日お話ししたいことを教えてください。",
  },
  {
    id: "confirm",
    label: "確認",
    icon: ClipboardCheck,
    heading: "内容の確認",
    description: "以下の内容で予約リクエストを送信します。",
  },
]

// 各ステップで「次へ」に進む前に検証するフィールド
const STEP_FIELDS: Record<StepId, (keyof BookingInput)[]> = {
  type: ["bookingType"],
  date: ["date"],
  slot: ["timeSlot"],
  profile: ["name", "email"],
  agenda: ["agenda"],
  confirm: [],
}

// 送信時にバリデーションで弾かれたら、そのフィールドを持つステップまで戻す
const FIELD_STEP_INDEX: Partial<Record<keyof BookingInput, number>> = {
  bookingType: 0,
  location: 0,
  date: 1,
  timeSlot: 2,
  name: 3,
  email: 3,
  company: 3,
  agenda: 4,
}

function formatSlotRange(slot: string): string {
  // Date を経由するとブラウザのタイムゾーンで終了時刻がずれるため、時刻文字列のまま加算する
  const [hour, minute] = slot.split(":").map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return slot
  const endText = `${String((hour + 1) % 24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  return `${slot} - ${endText}`
}

function formatBookingDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00+09:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return format(parsed, "yyyy年M月d日(E)", { locale: ja })
}

function buildFallbackSlots(dateStr: string, bookingType: "meet" | "対面"): string[] {
  const threshold = bookingType === "meet" ? Date.now() + 60 * 60 * 1000 : Date.now()
  return Array.from({ length: 14 }, (_, idx) => `${String(10 + idx).padStart(2, "0")}:00`).filter((slot) => {
    const slotStart = new Date(`${dateStr}T${slot}:00+09:00`)
    return slotStart.getTime() > threshold
  })
}

export default function AppointPage() {
  const initialDate = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), [])
  const [stepIndex, setStepIndex] = useState(0)
  const [serverMessage, setServerMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{ date: string; timeSlot: string; bookingType: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [calendarMonth, setCalendarMonth] = useState<Date>(initialDate)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotNotice, setSlotNotice] = useState("")
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [disabledDateKeys, setDisabledDateKeys] = useState<Set<string>>(new Set())

  const {
    register,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    trigger,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: "meet",
      date: "",
      timeSlot: "",
    },
  })

  const values = watch()
  const bookingType = values.bookingType
  const showLocation = bookingType === "対面"
  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [stepIndex])

  useEffect(() => {
    let cancelled = false
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((date) => date >= todayStart)

    const fetchMonthlyAvailability = async () => {
      setLoadingMonth(true)
      try {
        const checks = await Promise.all(
          monthDays.map(async (date) => {
            const dateStr = format(date, "yyyy-MM-dd")
            const response = await fetch(`/api/bookings?date=${dateStr}&bookingType=${encodeURIComponent(bookingType)}`)
            const json = await response.json().catch(() => ({ ok: false, slots: [] }))
            const isAvailable = !response.ok || !json.ok ? true : Array.isArray(json.slots) && json.slots.length > 0
            return { dateStr, isAvailable }
          })
        )

        if (cancelled) return
        setDisabledDateKeys(new Set(checks.filter((item) => !item.isAvailable).map((item) => item.dateStr)))
      } catch {
        if (!cancelled) setDisabledDateKeys(new Set())
      } finally {
        if (!cancelled) setLoadingMonth(false)
      }
    }

    fetchMonthlyAvailability()
    return () => {
      cancelled = true
    }
  }, [calendarMonth, bookingType])

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([])
      setSlotNotice("")
      return
    }

    let cancelled = false
    const fetchAvailability = async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const fallbackSlots = buildFallbackSlots(dateStr, bookingType)
      setLoadingSlots(true)
      try {
        const response = await fetch(`/api/bookings?date=${dateStr}&bookingType=${encodeURIComponent(bookingType)}`)
        const json = await response.json()
        if (cancelled) return
        if (response.ok && json.ok && Array.isArray(json.slots)) {
          setAvailableSlots(json.slots)
          setSlotNotice(json.leadTimeMessage || json.allDayBusyMessage || "")
        } else {
          setAvailableSlots(fallbackSlots)
          setSlotNotice("")
        }
      } catch {
        if (!cancelled) {
          setAvailableSlots(fallbackSlots)
          setSlotNotice("")
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }

    fetchAvailability()
    return () => {
      cancelled = true
    }
  }, [selectedDate, bookingType])

  const goNext = useCallback(async () => {
    const fields = STEP_FIELDS[step.id]
    const valid = fields.length === 0 || (await trigger(fields, { shouldFocus: true }))
    if (!valid) return

    // bookingSchema の場所必須チェックは superRefine で定義されており、
    // 他の必須項目が未入力のうちは zod が到達しないため、このステップでは自前で検証する
    if (step.id === "type") {
      if (showLocation && !(getValues("location") || "").trim()) {
        setError("location", { type: "manual", message: "対面予約の場合は場所の入力が必須です" }, { shouldFocus: true })
        return
      }
      clearErrors("location")
    }

    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1))
  }, [clearErrors, getValues, setError, showLocation, step.id, trigger])

  const goBack = useCallback(() => {
    setServerMessage("")
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  // 最終ステップで弾かれた場合、該当項目を編集できるステップまで戻す
  const onInvalid = (formErrors: Record<string, unknown>) => {
    const target = Object.keys(formErrors)
      .map((field) => FIELD_STEP_INDEX[field as keyof BookingInput])
      .filter((index): index is number => typeof index === "number")
      .sort((a, b) => a - b)[0]
    if (typeof target === "number") setStepIndex(target)
  }

  const onSubmit = async (input: BookingInput) => {
    setSubmitting(true)
    setServerMessage("")
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const result = await response.json()
      if (result.ok) {
        setSuccessInfo({
          date: input.date,
          timeSlot: input.timeSlot,
          bookingType: input.bookingType,
        })
        reset({ bookingType: input.bookingType, date: "", timeSlot: "" })
        setSelectedDate(undefined)
        setCalendarMonth(new Date(new Date().setHours(0, 0, 0, 0)))
        setStepIndex(0)
      } else {
        const detail = [result.message, result.hint, result.managePortalError, result.error].filter(Boolean).join("\n")
        setServerMessage(detail || "送信に失敗しました。")
      }
    } catch {
      setServerMessage("通信エラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setSubmitting(false)
    }
  }

  if (successInfo) {
    return (
      <BookingCompletionScreen
        title="予約完了"
        detail={`${formatBookingDate(successInfo.date)} ${formatSlotRange(successInfo.timeSlot)} / ${successInfo.bookingType}`}
        description="カレンダー招待と確認メールを送信しました。予約者専用ページURLはメールをご確認ください。"
        actionLabel="続けて予約する"
        onAction={() => setSuccessInfo(null)}
      />
    )
  }

  return (
    <main className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-4 sm:py-5">
        <header className="shrink-0">
          <h1 className="text-xl font-bold sm:text-2xl">予約ページ</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm [@media(max-height:780px)]:hidden">
            全{STEPS.length}ステップ・約1分で打ち合わせのご予約ができます。
          </p>
        </header>

        <nav aria-label="予約ステップ" className="mt-3 shrink-0">
          <ol className="flex items-center">
            {STEPS.map((item, index) => {
              const isDone = index < stepIndex
              const isCurrent = index === stepIndex
              const StepIcon = item.icon
              return (
                <li key={item.id} className={cn("flex items-center", index < STEPS.length - 1 && "flex-1")}>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                        isCurrent && "border-primary bg-primary text-primary-foreground",
                        isDone && "border-primary/60 bg-primary/15 text-primary",
                        !isCurrent && !isDone && "border-border text-muted-foreground"
                      )}
                    >
                      <StepIcon className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        "hidden text-[11px] sm:block [@media(max-height:740px)]:sm:hidden",
                        isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className={cn(
                        "mx-1 h-px flex-1 sm:mx-2 sm:-translate-y-2",
                        index < stepIndex ? "bg-primary/60" : "bg-border"
                      )}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          onKeyDown={(event) => {
            // 途中のステップで Enter を押しても送信せず、次のステップへ進める
            const target = event.target as HTMLElement
            if (event.key !== "Enter" || target.tagName === "TEXTAREA") return
            event.preventDefault()
            if (!isLastStep) void goNext()
          }}
          className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card"
        >
          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div key={step.id} className="animate-fade-in-step">
              <h2 className="text-lg font-semibold">{step.heading}</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm [@media(max-height:680px)]:hidden">
                {step.description}
              </p>

              <div className="mt-4">
                {step.id === "type" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          { value: "meet", title: "オンライン", note: "Google Meet / 1時間後の枠から予約可能", icon: Video },
                          { value: "対面", title: "対面", note: "ご指定の場所 / 2日前から予約可能", icon: MapPin },
                        ] as const
                      ).map((option) => {
                        const OptionIcon = option.icon
                        const checked = bookingType === option.value
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                              checked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            )}
                          >
                            <input
                              type="radio"
                              value={option.value}
                              className="sr-only"
                              {...register("bookingType", {
                                // 形式が変わると空き枠も変わるため選択済みの時間帯をクリアする
                                onChange: () => setValue("timeSlot", ""),
                              })}
                            />
                            <OptionIcon className={cn("mt-0.5 h-5 w-5 shrink-0", checked ? "text-primary" : "text-muted-foreground")} />
                            <span>
                              <span className="block font-medium">{option.title}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{option.note}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    {errors.bookingType && <p className="text-sm text-red-300">{errors.bookingType.message}</p>}

                    {showLocation && (
                      <div>
                        <Label htmlFor="location">場所（対面必須）</Label>
                        <Input
                          id="location"
                          placeholder="例: 渋谷駅周辺 / 御社オフィス"
                          {...register("location")}
                          className="mt-2"
                        />
                        {errors.location && <p className="mt-1 text-sm text-red-300">{errors.location.message}</p>}
                      </div>
                    )}
                  </div>
                )}

                {step.id === "date" && (
                  <div className="flex flex-col items-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        setValue("timeSlot", "")
                        setValue("date", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true })
                      }}
                      locale={ja}
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0))
                        if (date < today) return true
                        return disabledDateKeys.has(format(date, "yyyy-MM-dd"))
                      }}
                      className="booking-calendar rounded-lg border border-border"
                    />
                    <input type="hidden" {...register("date")} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {loadingMonth ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          この月の空き状況を確認中...
                        </span>
                      ) : selectedDate ? (
                        `選択中: ${format(selectedDate, "yyyy年M月d日(E)", { locale: ja })}`
                      ) : (
                        "日付を選択してください。"
                      )}
                    </p>
                    {errors.date && <p className="mt-1 text-sm text-red-300">{errors.date.message}</p>}
                  </div>
                )}

                {step.id === "slot" && (
                  <div>
                    <p className="text-sm font-medium">
                      {selectedDate ? format(selectedDate, "yyyy年M月d日(E)", { locale: ja }) : "-"} の空き枠
                    </p>
                    {loadingSlots ? (
                      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        空き時間を照会中...
                      </p>
                    ) : availableSlots.length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {availableSlots.map((slot) => {
                          const checked = values.timeSlot === slot
                          return (
                            <label
                              key={slot}
                              className={cn(
                                "flex cursor-pointer items-center justify-center rounded-md border px-2 py-3 text-sm transition-colors",
                                checked ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50"
                              )}
                            >
                              <input type="radio" value={slot} className="sr-only" {...register("timeSlot")} />
                              {formatSlotRange(slot)}
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-amber-300">
                        {slotNotice || "この日は空き時間がありません。前のステップから別の日付を選択してください。"}
                      </p>
                    )}
                    {errors.timeSlot && <p className="mt-3 text-sm text-red-300">{errors.timeSlot.message}</p>}
                  </div>
                )}

                {step.id === "profile" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">お名前</Label>
                      <Input id="name" autoComplete="name" {...register("name")} className="mt-2" />
                      {errors.name && <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input id="email" type="email" autoComplete="email" {...register("email")} className="mt-2" />
                      {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="company">会社名（任意）</Label>
                      <Input id="company" autoComplete="organization" {...register("company")} className="mt-2" />
                    </div>
                  </div>
                )}

                {step.id === "agenda" && (
                  <div>
                    <Label htmlFor="agenda">相談内容</Label>
                    <Textarea
                      id="agenda"
                      rows={8}
                      placeholder="例: 新規Webサービスの開発について相談したいです。"
                      {...register("agenda")}
                      className="mt-2"
                    />
                    {errors.agenda && <p className="mt-1 text-sm text-red-300">{errors.agenda.message}</p>}
                  </div>
                )}

                {step.id === "confirm" && (
                  <dl className="divide-y divide-border rounded-lg border border-border text-sm">
                    {[
                      { label: "形式", value: bookingType === "meet" ? "オンライン（Google Meet）" : "対面" },
                      ...(showLocation ? [{ label: "場所", value: values.location || "-" }] : []),
                      { label: "日時", value: `${formatBookingDate(values.date)} ${formatSlotRange(values.timeSlot)}` },
                      { label: "お名前", value: values.name || "-" },
                      { label: "メール", value: values.email || "-" },
                      { label: "会社名", value: values.company || "-" },
                      { label: "相談内容", value: values.agenda || "-" },
                    ].map((row) => (
                      <div key={row.label} className="flex gap-4 px-4 py-2.5">
                        <dt className="w-20 shrink-0 text-muted-foreground">{row.label}</dt>
                        <dd className="whitespace-pre-wrap break-words">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {serverMessage && (
                <p className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{serverMessage}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3">
            <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0 || submitting}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              戻る
            </Button>
            <span className="text-xs text-muted-foreground">
              {stepIndex + 1} / {STEPS.length}
            </span>
            {/* 同じボタンの type を submit に差し替えると、クリックの既定動作で
                途中のステップから送信されてしまうため常に type="button" とし、送信は明示的に呼ぶ */}
            {isLastStep ? (
              <Button key="submit" type="button" onClick={() => void handleSubmit(onSubmit, onInvalid)()} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  "予約リクエストを送信"
                )}
              </Button>
            ) : (
              <Button key="next" type="button" onClick={goNext}>
                次へ
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}
