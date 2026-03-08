"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { bookingSchema, type BookingInput } from "@/lib/booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AppointPage() {
  const [serverMessage, setServerMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: "meet",
    },
  })

  const bookingType = watch("bookingType")
  const showLocation = useMemo(() => bookingType === "対面", [bookingType])

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
      if (result.ok) reset({ bookingType: values.bookingType })
    } catch {
      setServerMessage("通信エラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-3xl px-4 py-24">
        <h1 className="text-3xl font-bold">予約ページ</h1>
        <p className="mt-2 text-slate-300">
          Google Calendar 連携対応の予約フォームです。現時点では API モックで受け付けます。
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
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

          <div>
            <Label htmlFor="date">希望日時</Label>
            <Input id="date" placeholder="例: 2026-03-15 14:00" {...register("date")} className="mt-2" />
            {errors.date && <p className="mt-1 text-sm text-red-300">{errors.date.message}</p>}
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
