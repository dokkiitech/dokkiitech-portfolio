"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  if (value === "active") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30"
  if (value === "canceled") return "bg-rose-500/15 text-rose-200 border-rose-400/30"
  return "bg-slate-500/15 text-slate-200 border-slate-300/30"
}

export default function AppointmentAdminPage() {
  const [records, setRecords] = useState<AdminBookingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [filters, setFilters] = useState({
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

  const filteredRecords = useMemo(() => {
    const keyword = filters.query.trim().toLowerCase()
    if (!keyword) return records
    return records.filter((record) =>
      [record.name, record.email, record.company || "", record.agenda, record.bookingId]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [filters.query, records])

  useEffect(() => {
    void loadBookings()
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card/95 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-cyan-300">管理者向け</p>
              <h1 className="text-3xl font-bold">予約一覧管理</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                全予約の確認と、日付・ステータスでの絞り込みができます。
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              表示件数: <span className="font-medium text-foreground">{filteredRecords.length}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filterDate">日付で絞り込み</Label>
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
                    onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="active">有効</option>
                    <option value="canceled">キャンセル</option>
                    <option value="expired">期限切れ</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="filterQuery">キーワード検索</Label>
                  <Input
                    id="filterQuery"
                    value={filters.query}
                    onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                    placeholder="予約者名 / メール / 会社名"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button onClick={() => void loadBookings()} disabled={loading}>
                  {loading ? "読み込み中..." : "再読み込み"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const resetFilters = { date: "", status: "all", query: "" }
                    setFilters(resetFilters)
                    void loadBookings(resetFilters)
                  }}
                >
                  絞り込みをリセット
                </Button>
              </div>

              {message && <p className="mt-4 text-sm text-rose-300 whitespace-pre-line">{message}</p>}
            </aside>

            <div className="min-w-0">
              <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-background/80">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">日時</th>
                        <th className="px-4 py-3 font-medium">予約者</th>
                        <th className="px-4 py-3 font-medium">方式</th>
                        <th className="px-4 py-3 font-medium">ステータス</th>
                        <th className="px-4 py-3 font-medium">詳細</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="align-top">
                          <td className="px-4 py-4">
                            <div className="font-medium">{formatBookingDate(record.date)}</div>
                            <div className="text-muted-foreground">{record.timeSlot}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium">{record.name}</div>
                            <div className="text-muted-foreground">{record.email}</div>
                            {record.company && <div className="text-muted-foreground">{record.company}</div>}
                          </td>
                          <td className="px-4 py-4">
                            <div>{formatBookingType(record.bookingType)}</div>
                            {record.location && <div className="text-muted-foreground">{record.location}</div>}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(record.status)}`}>
                              {formatStatus(record.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="line-clamp-3 text-muted-foreground">{record.agenda}</div>
                              <div className="text-xs text-muted-foreground">作成: {formatDateTime(record.createdAt)}</div>
                              <div className="text-xs text-muted-foreground">更新: {formatDateTime(record.updatedAt)}</div>
                            </div>
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
                  <article key={record.id} className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{record.name}</h2>
                        <p className="text-sm text-muted-foreground">{record.email}</p>
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
                      {record.location && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">場所</dt>
                          <dd className="text-right">{record.location}</dd>
                        </div>
                      )}
                      {record.company && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">会社名</dt>
                          <dd className="text-right">{record.company}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-muted-foreground">相談内容</dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm">{record.agenda}</dd>
                      </div>
                    </dl>
                  </article>
                ))}

                {!loading && filteredRecords.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    表示できる予約はありません。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
