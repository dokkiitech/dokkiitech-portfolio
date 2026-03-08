"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  meetUrl?: string | null
}

type Step = "loading" | "set-password" | "login" | "manage" | "error"

export default function ManageBookingPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const token = search.get("token") || ""

  const [step, setStep] = useState<Step>("loading")
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [record, setRecord] = useState<ManageRecord | null>(null)
  const [form, setForm] = useState({
    date: "",
    timeSlot: "",
    bookingType: "meet",
    location: "",
    company: "",
    agenda: "",
  })

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
        if (!checked.record.passwordSet) {
          setRecord(checked.record)
          setStep("set-password")
          return
        }
        setStep("login")
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

  const onLogin = async () => {
    const checked = await verify(password)
    if (!checked.ok || !checked.record) {
      setMessage(checked.message || "認証に失敗しました。")
      return
    }
    setRecord(checked.record)
    setForm({
      date: checked.record.date,
      timeSlot: checked.record.timeSlot,
      bookingType: checked.record.bookingType,
      location: checked.record.location || "",
      company: checked.record.company || "",
      agenda: checked.record.agenda,
    })
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
    const response = await fetch(`/api/bookings/manage/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password,
        date: form.date,
        timeSlot: form.timeSlot,
        bookingType: form.bookingType,
        location: form.location,
        company: form.company,
        agenda: form.agenda,
      }),
    })
    const json = await response.json()
    setMessage(json.message || "更新結果を確認してください。")
  }

  const onCancel = async () => {
    const response = await fetch(`/api/bookings/manage/${params.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    const json = await response.json()
    setMessage(json.message || "キャンセル結果を確認してください。")
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-3xl px-4 py-24">
        <h1 className="text-3xl font-bold">予約者専用ページ</h1>
        <p className="mt-2 text-slate-300">このページは予約日 23:59 まで有効です。</p>

        {step === "loading" && <p className="mt-8">読み込み中...</p>}

        {step === "set-password" && (
          <div className="mt-8 space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
            <Label htmlFor="newPassword">専用ページ用パスワードを設定（4文字以上）</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Button onClick={onSetPassword}>パスワードを設定してログイン</Button>
          </div>
        )}

        {step === "login" && (
          <div className="mt-8 space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button onClick={onLogin}>ログイン</Button>
          </div>
        )}

        {step === "manage" && record && (
          <div className="mt-8 space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
            <p className="text-sm text-slate-300">対象: {record.name} / {record.email}</p>
            <div>
              <Label>日付</Label>
              <Input value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
            </div>
            <div>
              <Label>時間</Label>
              <Input value={form.timeSlot} onChange={(e) => setForm((prev) => ({ ...prev, timeSlot: e.target.value }))} />
            </div>
            <div>
              <Label>形式</Label>
              <Input value={form.bookingType} onChange={(e) => setForm((prev) => ({ ...prev, bookingType: e.target.value }))} />
            </div>
            <div>
              <Label>場所（対面時）</Label>
              <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
            </div>
            <div>
              <Label>会社名（任意）</Label>
              <Input value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} />
            </div>
            <div>
              <Label>相談内容</Label>
              <Textarea value={form.agenda} onChange={(e) => setForm((prev) => ({ ...prev, agenda: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button onClick={onUpdate}>予約を変更</Button>
              <Button variant="destructive" onClick={onCancel}>予約をキャンセル</Button>
            </div>
          </div>
        )}

        {step === "error" && <p className="mt-8 text-red-300">{message}</p>}
        {message && step !== "error" && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-800 p-3 text-sm">{message}</p>}
      </section>
    </main>
  )
}
