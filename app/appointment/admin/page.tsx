"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyBookingIdButton } from "@/components/copy-booking-id-button"

type BookingStatus = "active" | "canceled" | "expired"

interface AdminBookingRecord {
  id: string
  bookingId: string
  name: string
  email: string
  company?: string | null
  bookingType: "meet" | "対面"
  date: string
  timeSlot: string
  agenda: string
  location?: string | null
  status: BookingStatus
  calendarEventUrl?: string | null
  meetUrl?: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
}

interface SearchFilters {
  date: string
  status: "all" | BookingStatus
  query: string
}

function formatBookingDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00+09:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return format(parsed, "yyyy年M月d日(E)", { locale: ja })
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return format(parsed, "yyyy/MM/dd HH:mm")
}

function formatBookingType(value: "meet" | "対面"): string {
  return value === "meet" ? "Google Meet" : "対面"
}

function formatStatus(value: BookingStatus): string {
  if (value === "active") return "有効"
  if (value === "canceled") return "キャンセル"
  return "期限切れ"
}

function getStatusClassName(value: BookingStatus): string {
  if (value === "active") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
  if (value === "canceled") return "border-rose-400/30 bg-rose-500/15 text-rose-200"
  return "border-slate-300/30 bg-slate-500/15 text-slate-200"
}

function sameDate(date: Date | undefined, key: string): boolean {
  if (!date) return false
  return format(date, "yyyy-MM-dd") === key
}

export default function AppointmentAdminPage() {
  const [records, setRecords] = useState<AdminBookingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [mtgSummaryLoading, setMtgSummaryLoading] = useState(false)
  const [mtgSummaryMessage, setMtgSummaryMessage] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<AdminBookingRecord | null>(null)
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date())
  const [filters, setFilters] = useState<SearchFilters>({
    date: "",
    status: "all",
    query: "",
  })

  const loadBookings = async (nextFilters = filters) => {
    setLoading(true)
    setMessage("")
    try {
      const params = new URLSearchParams()
      if (nextFilters.date) params.set("date", nextFilters.date)
      if (nextFilters.status !== "all") params.set("status", nextFilters.status)

      const response = await fetch(`/api/bookings/admin?${params.toString()}`)
      const json = await response.json()
      if (!response.ok || !json.ok) {
        setRecords([])
        setMessage(json.message || "予約一覧を取得できませんでした。")
        return
      }

      setRecords(Array.isArray(json.records) ? (json.records as AdminBookingRecord[]) : [])
    } catch {
      setMessage("通信エラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [])

  const filteredRecords = useMemo(() => {
    const keyword = filters.query.trim().toLowerCase()
    if (!keyword) return records
    return records.filter((record) =>
      [record.bookingId, record.name].join(" ").toLowerCase().includes(keyword)
    )
  }, [filters.query, records])

  const selectedDateKey = calendarDate ? format(calendarDate, "yyyy-MM-dd") : ""
  const calendarRecords = useMemo(
    () => filteredRecords.filter((record) => record.date === selectedDateKey),
    [filteredRecords, selectedDateKey]
  )

  const sendMtgSummary = async () => {
    setMtgSummaryLoading(true)
    setMtgSummaryMessage("")

    try {
      const response = await fetch("/api/bookings/admin/mtg-summary", {
        method: "POST",
      })
      const json = await response.json()

      if (!response.ok || !json.ok) {
        const detail = typeof json.detail === "string" ? `\n${json.detail}` : ""
        setMtgSummaryMessage((json.message || "MTG サマリーの送信に失敗しました。") + detail)
        return
      }

      setMtgSummaryMessage(
        `${json.message || "MTG サマリーを送信しました。"}\nDB: ${json.dbStatus || "-"} / 今日 ${json.todayCount ?? 0}件 / 明日 ${json.tomorrowCount ?? 0}件`
      )
    } catch {
      setMtgSummaryMessage("通信エラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setMtgSummaryLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card/95 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-cyan-300">管理者向け</p>
              <h1 className="text-3xl font-bold">予約管理</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                一覧表示とカレンダービューを切り替えながら、予約番号ベースで確認できます。
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Button type="button" variant="outline" onClick={() => void sendMtgSummary()} disabled={mtgSummaryLoading}>
                {mtgSummaryLoading ? "送信中..." : "MTGデイリーサマリーを手動送信"}
              </Button>
              <div className="text-sm text-muted-foreground">
                表示件数: <span className="font-medium text-foreground">{filteredRecords.length}</span>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="mt-6 rounded-2xl border border-border bg-background/60 px-4">
            <AccordionItem value="search" className="border-none">
              <AccordionTrigger className="py-4 text-base">検索・絞り込み</AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="filterQuery">予約番号 / 予約者名</Label>
                    <Input
                      id="filterQuery"
                      value={filters.query}
                      onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                      placeholder="例: 123456789 / 山田"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="filterDate">日付</Label>
                    <Input
                      id="filterDate"
                      type="date"
                      value={filters.date}
                      onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="filterStatus">ステータス</Label>
                    <select
                      id="filterStatus"
                      value={filters.status}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, status: event.target.value as SearchFilters["status"] }))
                      }
                      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="all">すべて</option>
                      <option value="active">有効</option>
                      <option value="canceled">キャンセル</option>
                      <option value="expired">期限切れ</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => void loadBookings()} disabled={loading}>
                    {loading ? "読み込み中..." : "検索する"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const resetFilters: SearchFilters = { date: "", status: "all", query: "" }
                      setFilters(resetFilters)
                      void loadBookings(resetFilters)
                    }}
                  >
                    リセット
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {message && <p className="mt-4 whitespace-pre-line text-sm text-rose-300">{message}</p>}
          {mtgSummaryMessage && <p className="mt-4 whitespace-pre-line text-sm text-cyan-200">{mtgSummaryMessage}</p>}

          <Tabs defaultValue="list" className="mt-6">
            <TabsList>
              <TabsTrigger value="list">一覧表示</TabsTrigger>
              <TabsTrigger value="calendar">カレンダービュー</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-background/80">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">予約番号</th>
                        <th className="px-4 py-3 font-medium">日時</th>
                        <th className="px-4 py-3 font-medium">予約者</th>
                        <th className="px-4 py-3 font-medium">方式</th>
                        <th className="px-4 py-3 font-medium">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="cursor-pointer transition-colors hover:bg-white/5"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{record.bookingId}</span>
                              <CopyBookingIdButton bookingId={record.bookingId} size="icon" className="h-8 w-8 shrink-0" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium">{formatBookingDate(record.date)}</div>
                            <div className="text-muted-foreground">{record.timeSlot}</div>
                          </td>
                          <td className="px-4 py-4 font-medium">{record.name}</td>
                          <td className="px-4 py-4">{formatBookingType(record.bookingType)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(record.status)}`}>
                              {formatStatus(record.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!loading && filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                            表示できる予約はありません。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 md:hidden">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs text-cyan-300">{record.bookingId}</p>
                          <CopyBookingIdButton bookingId={record.bookingId} size="icon" className="h-7 w-7 shrink-0" />
                        </div>
                        <h2 className="mt-1 font-semibold">{record.name}</h2>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(record.status)}`}>
                        {formatStatus(record.status)}
                      </span>
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">日時</dt>
                        <dd className="text-right">{formatBookingDate(record.date)} {record.timeSlot}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">方式</dt>
                        <dd className="text-right">{formatBookingType(record.bookingType)}</dd>
                      </div>
                    </dl>
                    <Button type="button" variant="ghost" className="mt-4 w-full" onClick={() => setSelectedRecord(record)}>
                      詳細を見る
                    </Button>
                  </div>
                ))}

                {!loading && filteredRecords.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    表示できる予約はありません。
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-border bg-background/60 p-3">
                  <Calendar
                    mode="single"
                    locale={ja}
                    selected={calendarDate}
                    onSelect={setCalendarDate}
                    modifiers={{
                      booked: filteredRecords.map((record) => new Date(`${record.date}T00:00:00+09:00`)),
                      selectedBooked: filteredRecords
                        .filter((record) => sameDate(calendarDate, record.date))
                        .map((record) => new Date(`${record.date}T00:00:00+09:00`)),
                    }}
                    modifiersClassNames={{
                      booked: "bg-cyan-500/15 text-cyan-100 font-semibold",
                      selectedBooked: "bg-cyan-500 text-black hover:bg-cyan-400",
                    }}
                    className="mx-auto"
                  />
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="border-b border-border pb-4">
                    <p className="text-sm text-muted-foreground">選択日</p>
                    <h2 className="text-xl font-semibold">
                      {selectedDateKey ? formatBookingDate(selectedDateKey) : "日付を選択してください"}
                    </h2>
                  </div>

                  <div className="mt-4 space-y-3">
                    {calendarRecords.map((record) => (
                      <div key={record.id} className="rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs text-cyan-300">{record.bookingId}</p>
                              <CopyBookingIdButton bookingId={record.bookingId} size="icon" className="h-7 w-7 shrink-0" />
                            </div>
                            <p className="mt-1 font-medium">{record.name}</p>
                          </div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(record.status)}`}>
                            {formatStatus(record.status)}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>{record.timeSlot}</span>
                          <span>{formatBookingType(record.bookingType)}</span>
                        </div>
                        <Button type="button" variant="ghost" className="mt-4 w-full" onClick={() => setSelectedRecord(record)}>
                          詳細を見る
                        </Button>
                      </div>
                    ))}

                    {!loading && calendarRecords.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        この日の予約はありません。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>予約詳細</DialogTitle>
                <DialogDescription>
                  予約番号 {selectedRecord.bookingId} / {selectedRecord.name}
                </DialogDescription>
              </DialogHeader>

              <div className="flex justify-start">
                <CopyBookingIdButton bookingId={selectedRecord.bookingId} className="w-full sm:w-auto" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">日時</p>
                  <p className="mt-1 font-medium">{formatBookingDate(selectedRecord.date)} {selectedRecord.timeSlot}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">方式 / ステータス</p>
                  <p className="mt-1 font-medium">
                    {formatBookingType(selectedRecord.bookingType)} / {formatStatus(selectedRecord.status)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">予約者</p>
                  <p className="mt-1 font-medium">{selectedRecord.name}</p>
                  {selectedRecord.company && <p className="text-sm text-muted-foreground">{selectedRecord.company}</p>}
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">メールアドレス</p>
                  <p className="mt-1 break-all font-medium">{selectedRecord.email}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">相談内容</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selectedRecord.agenda}</p>
              </div>

              {selectedRecord.location && (
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">場所</p>
                  <p className="mt-1 font-medium">{selectedRecord.location}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">作成日時</p>
                  <p className="mt-1 text-sm">{formatDateTime(selectedRecord.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">更新日時</p>
                  <p className="mt-1 text-sm">{formatDateTime(selectedRecord.updatedAt)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">関連リンク</p>
                <div className="mt-2 space-y-2 text-sm">
                  {selectedRecord.meetUrl && (
                    <p>
                      Meet:{" "}
                      <a href={selectedRecord.meetUrl} target="_blank" rel="noreferrer" className="text-cyan-300 underline">
                        {selectedRecord.meetUrl}
                      </a>
                    </p>
                  )}
                  {selectedRecord.calendarEventUrl && (
                    <p>
                      Google Calendar:{" "}
                      <a
                        href={selectedRecord.calendarEventUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 underline"
                      >
                        予定を開く
                      </a>
                    </p>
                  )}
                  {!selectedRecord.meetUrl && !selectedRecord.calendarEventUrl && (
                    <p className="text-muted-foreground">関連リンクはありません。</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
