"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"

export function formatSlotRange(slot: string): string {
  // Date#getHours() はブラウザのTZ依存になるため算術で求める
  const [hour, minute] = slot.split(":").map(Number)
  const total = hour * 60 + minute + 60
  const endText = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
  return `${slot} - ${endText}`
}

function buildFallbackSlots(date: string, bookingType: "meet" | "対面"): string[] {
  const threshold = bookingType === "meet" ? Date.now() + 60 * 60 * 1000 : Date.now()
  return Array.from({ length: 14 }, (_, idx) => `${String(10 + idx).padStart(2, "0")}:00`).filter((slot) => {
    const slotStart = new Date(`${date}T${slot}:00+09:00`)
    return slotStart.getTime() > threshold
  })
}

interface BookingSlotPickerProps {
  bookingType: "meet" | "対面"
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  timeSlot: string
  onTimeSlotChange: (slot: string) => void
  // 値が変わると空き枠を取り直す（予約更新後など）
  refreshKey?: string
  name?: string
}

// 日付カレンダー + 空き時間帯の選択。予約者用の予約管理ページと管理画面で共通。
export function BookingSlotPicker({
  bookingType,
  date,
  onDateChange,
  timeSlot,
  onTimeSlotChange,
  refreshKey,
  name = "booking-time-slot",
}: BookingSlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const dateStr = date ? format(date, "yyyy-MM-dd") : ""

  useEffect(() => {
    if (!dateStr) {
      setAvailableSlots([])
      return
    }
    let canceled = false
    setLoadingSlots(true)
    fetch(`/api/bookings?date=${dateStr}&bookingType=${encodeURIComponent(bookingType)}`)
      .then(async (response) => {
        const json = await response.json()
        return response.ok && json.ok && Array.isArray(json.slots)
          ? (json.slots as string[])
          : buildFallbackSlots(dateStr, bookingType)
      })
      .catch(() => buildFallbackSlots(dateStr, bookingType))
      .then((slots) => {
        if (!canceled) setAvailableSlots(Array.from(new Set(slots)))
      })
      .finally(() => {
        if (!canceled) setLoadingSlots(false)
      })
    return () => {
      canceled = true
    }
  }, [dateStr, bookingType, refreshKey])

  return (
    <>
      <div className="rounded-lg border border-border p-3">
        <Label>日付選択</Label>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          locale={ja}
          disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
          className="mt-2"
        />
      </div>

      <div className="rounded-lg border border-border p-3">
        <Label>時間帯選択</Label>
        {!date ? (
          <p className="mt-2 text-sm text-muted-foreground">日付を選択してください。</p>
        ) : loadingSlots ? (
          <p className="mt-2 text-sm text-muted-foreground">空き時間を照会中...</p>
        ) : availableSlots.length > 0 ? (
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {availableSlots.map((slot) => (
              <label key={slot} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2">
                <input type="radio" name={name} checked={timeSlot === slot} onChange={() => onTimeSlotChange(slot)} />
                <span>{formatSlotRange(slot)}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">選択日の空き時間がありません。</p>
        )}
      </div>
    </>
  )
}
