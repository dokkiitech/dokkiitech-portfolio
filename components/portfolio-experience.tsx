"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { ZennArticle } from "@/lib/zenn"
import type { FocusStackItem } from "@/lib/github"

type Mode = "terminal" | "ui"

interface PortfolioExperienceProps {
  blogArticles: ZennArticle[]
  productArticles: ZennArticle[]
  focusStack: FocusStackItem[]
}

interface TerminalLine {
  id: number
  kind: "command" | "output"
  text: string
}

interface BookingFlowState {
  step: "name" | "email" | "company" | "type" | "location" | "date" | "slot" | "agenda" | "confirm" | "submitting"
  name: string
  email: string
  company: string
  bookingType: "meet" | "対面"
  location: string
  date: string
  timeSlot: string
  agenda: string
  slots: string[]
}

const bookingPlaceholders: Record<BookingFlowState["step"], string> = {
  name: "お名前を入力",
  email: "メールアドレスを入力",
  company: "会社名を入力（なければ - ）",
  type: "meet または 対面",
  location: "場所を入力",
  date: "YYYY-MM-DD",
  slot: "番号 または HH:MM",
  agenda: "相談内容を入力",
  confirm: "y / n",
  submitting: "送信中...",
}

const prompt = "dokkiitech@portfolio:~$"
const snsLinks = [
  { label: "X", href: "https://x.com/dokkiitech" },
  { label: "Instagram", href: "https://instagram.com/dokkiitech" },
  { label: "GitHub", href: "https://github.com/dokkiitech" },
  { label: "Zenn", href: "https://zenn.dev/dokkiitech" },
  { label: "Email", href: "mailto:info@dokkiitech.com" },
]

const pageMap: Record<string, string> = {
  home: "/",
  profile: "/profile",
  blog: "/blog",
  product: "/products",
  products: "/products",
  booking: "/appointment",
  appoint: "/appointment",
  appointment: "/appointment",
  sns: "/contact",
  contact: "/contact",
}
const rootCommands = ["help", "ls", "profile", "blog", "product", "contact", "appointment", "book", "clear", "cd"] as const
const cdTargets = ["home", "profile", "blog", "products", "contact", "appointment"] as const

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function PortfolioExperience({ blogArticles, productArticles, focusStack }: PortfolioExperienceProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("terminal")
  const [history, setHistory] = useState<TerminalLine[]>([])
  const [command, setCommand] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [bookingFlow, setBookingFlow] = useState<BookingFlowState | null>(null)
  const lineIdRef = useRef(0)
  const typingSessionRef = useRef(0)
  const terminalInputRef = useRef<HTMLInputElement | null>(null)
  const terminalBottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (mode !== "terminal") return
    terminalBottomRef.current?.scrollIntoView({ block: "nearest" })
  }, [history, mode])

  const commandMap = useMemo(
    () => ({
      help: [
        "利用可能: help, ls, profile, blog, product, contact, appointment, book, cd <page>, clear",
        "book: ターミナルから対話式で打ち合わせを予約できます。",
      ],
      ls: [
        "/home /profile /blog /products /contact /appointment",
      ],
      profile: [
        "木戸亮輔 / DOKKIITECH",
        "",
        "初めまして或いはこんにちは",
        "木戸です。",
        "28卒の学生エンジニアです。",
        "",
        "主領域: バックエンド",
        "その他にもインフラ周りやフロントエンドも適度にできる",
        "自称フロンエンドエンジニアです。",
        "",
        "様々なIT団体を運営し自身の技術力向上と共に",
        "地域のIT文化の活性化をするための活動をしています。",
        "また自宅サーバー dokkiitech Regionを運営し",
        "自身のプロダクトを幅広く更新しています。",
        "",
        "当サイトでは作ってきた作品の公開やブログ、",
        "私の使用技術の確認やお打ち合わせの予約ができます。",
        "気が向いた時にのんびり遊んでみてください。",
        "",
        "当サイトのTerminal UIに困惑された方もいらっしゃると思います。",
        "ごめんなさい。",
        "非エンジニアの方でも一応見れる設定になっていますので",
        "よければもっと覗いてください。",
        "",
        "GitHub 技術スタック:",
        ...(focusStack.length > 0
          ? focusStack.map((item) => {
              const filled = Math.max(1, Math.round(item.percentage / 5))
              const bar = `${"█".repeat(filled)}${"░".repeat(20 - filled)}`
              return `${item.language.padEnd(14, " ")} [${bar}] ${item.percentage}%`
            })
          : ["(stack data unavailable)"]),
      ],
      blog: blogArticles.slice(0, 3).map((item) => `- ${item.title}`),
      product: productArticles.slice(0, 3).map((item) => `- ${item.title}`),
      sns: snsLinks.map((item) => `- ${item.label}: ${item.href}`),
      contact: snsLinks.map((item) => `- ${item.label}: ${item.href}`),
      booking: ["予約ページ: /appointment", "cd booking で移動、book でこのままターミナルから予約できます。"],
      appointment: ["予約ページ: /appointment", "cd appointment で移動、book でこのままターミナルから予約できます。"],
    }),
    [blogArticles, productArticles, focusStack]
  )
  const terminalTitleArt = useMemo(
    () =>
      [
        "██████╗  ██████╗ ██╗  ██╗██╗  ██╗██╗██╗████████╗███████╗ ██████╗██╗  ██╗",
        "██╔══██╗██╔═══██╗██║ ██╔╝██║ ██╔╝██║██║╚══██╔══╝██╔════╝██╔════╝██║  ██║",
        "██║  ██║██║   ██║█████╔╝ █████╔╝ ██║██║   ██║   █████╗  ██║     ███████║",
        "██║  ██║██║   ██║██╔═██╗ ██╔═██╗ ██║██║   ██║   ██╔══╝  ██║     ██╔══██║",
        "██████╔╝╚██████╔╝██║  ██╗██║  ██╗██║██║   ██║   ███████╗╚██████╗██║  ██║",
        "╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝",
        "                    PORTFOLIO TERMINAL",
      ].join("\n"),
    []
  )

  const pushLine = (kind: TerminalLine["kind"], text: string): number => {
    const id = ++lineIdRef.current
    setHistory((prev) => [...prev, { id, kind, text }])
    return id
  }

  const updateLine = (id: number, text: string) => {
    setHistory((prev) => prev.map((line) => (line.id === id ? { ...line, text } : line)))
  }

  const typeLine = async (text: string, sessionId: number) => {
    const id = pushLine("output", "")
    let current = ""
    setIsTyping(true)
    for (const ch of text) {
      if (typingSessionRef.current !== sessionId) return
      current += ch
      updateLine(id, current)
      await sleep(14)
    }
    setIsTyping(false)
  }

  const typeLines = async (lines: string[], sessionId: number) => {
    for (const line of lines) {
      if (typingSessionRef.current !== sessionId) return
      await typeLine(line, sessionId)
      await sleep(90)
    }
  }

  useEffect(() => {
    if (mode !== "terminal") return

    const boot = () => {
      const sessionId = Date.now()
      typingSessionRef.current = sessionId
      setHistory([])
      setTimeout(() => terminalInputRef.current?.focus(), 60)
      typeLines(
        [
          "Portfolio terminalへようこそ。",
          "help でコマンド一覧を表示できます。",
        ],
        sessionId
      )
    }

    const splashActive = (window as unknown as { __DOKKII_SPLASH_ACTIVE?: boolean }).__DOKKII_SPLASH_ACTIVE
    if (splashActive) {
      const onSplashDone = () => boot()
      window.addEventListener("dokkii:splash-finished", onSplashDone, { once: true })
      return () => window.removeEventListener("dokkii:splash-finished", onSplashDone)
    }

    boot()
  }, [mode])

  const handleCd = async (rawTarget: string, sessionId: number) => {
    const trimmed = rawTarget.trim().toLowerCase()
    const normalized = trimmed.replace(/^~\//, "").replace(/^\/+/, "")
    const target = normalized || "home"
    const path = pageMap[target]
    if (!path) {
      await typeLines([`cd: ${rawTarget}: No such directory`], sessionId)
      return
    }
    await typeLines([`opening ${path} ...`], sessionId)
    router.push(path)
  }

  const startBookingFlow = async (sessionId: number) => {
    setBookingFlow({
      step: "name",
      name: "",
      email: "",
      company: "",
      bookingType: "meet",
      location: "",
      date: "",
      timeSlot: "",
      agenda: "",
      slots: [],
    })
    await typeLines(
      [
        "対話式の予約を開始します。cancel と入力するといつでも中断できます。",
        "お名前を入力してください。",
      ],
      sessionId
    )
  }

  const fetchSlotsForDate = async (date: string, bookingType: "meet" | "対面") => {
    const response = await fetch(`/api/bookings?date=${date}&bookingType=${encodeURIComponent(bookingType)}`)
    const json = await response.json()
    if (!response.ok || !json.ok) {
      return { ok: false as const, message: (json.message as string) || "空き時間の取得に失敗しました。" }
    }
    const notice = (json.leadTimeMessage || json.allDayBusyMessage) as string | undefined
    return { ok: true as const, slots: (json.slots as string[]) || [], notice }
  }

  const handleBookingInput = async (raw: string, flow: BookingFlowState, sessionId: number) => {
    if (raw.toLowerCase() === "cancel") {
      setBookingFlow(null)
      await typeLines(["予約を中断しました。また book でいつでも再開できます。"], sessionId)
      return
    }

    switch (flow.step) {
      case "name": {
        setBookingFlow({ ...flow, step: "email", name: raw })
        await typeLines(["メールアドレスを入力してください。"], sessionId)
        return
      }
      case "email": {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
          await typeLines(["メールアドレスの形式が不正です。もう一度入力してください。"], sessionId)
          return
        }
        setBookingFlow({ ...flow, step: "company", email: raw })
        await typeLines(["会社名を入力してください。（個人の場合は - を入力）"], sessionId)
        return
      }
      case "company": {
        setBookingFlow({ ...flow, step: "type", company: raw === "-" ? "" : raw })
        await typeLines(["予約タイプを入力してください。（meet または 対面）"], sessionId)
        return
      }
      case "type": {
        const lower = raw.toLowerCase()
        if (lower !== "meet" && raw !== "対面") {
          await typeLines(["meet か 対面 のどちらかを入力してください。"], sessionId)
          return
        }
        const bookingType = lower === "meet" ? ("meet" as const) : ("対面" as const)
        if (bookingType === "対面") {
          setBookingFlow({ ...flow, step: "location", bookingType })
          await typeLines(["対面の場所を入力してください。"], sessionId)
        } else {
          setBookingFlow({ ...flow, step: "date", bookingType })
          await typeLines(["希望日を入力してください。（例: 2026-09-01）"], sessionId)
        }
        return
      }
      case "location": {
        setBookingFlow({ ...flow, step: "date", location: raw })
        await typeLines(["希望日を入力してください。（例: 2026-09-01）※対面は2日前から予約可能です", ], sessionId)
        return
      }
      case "date": {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          await typeLines(["YYYY-MM-DD の形式で入力してください。（例: 2026-09-01）"], sessionId)
          return
        }
        await typeLines([`空き時間を確認しています...`], sessionId)
        const result = await fetchSlotsForDate(raw, flow.bookingType)
        if (!result.ok) {
          await typeLines([result.message, "別の日付を入力してください。"], sessionId)
          return
        }
        if (result.notice || result.slots.length === 0) {
          await typeLines([result.notice || "この日は空きがありません。", "別の日付を入力してください。"], sessionId)
          return
        }
        setBookingFlow({ ...flow, step: "slot", date: raw, slots: result.slots })
        await typeLines(
          [
            `空き時間 (${raw}):`,
            ...result.slots.map((slot, idx) => `  [${idx + 1}] ${slot}`),
            "時刻（例: 15:00 または 15）か一覧の番号で選択してください。",
          ],
          sessionId
        )
        return
      }
      case "slot": {
        // 「14」のような入力は 14:00 の時刻指定を優先し、該当スロットが無ければ一覧の番号として扱う
        const asTime = /^\d{1,2}$/.test(raw) ? `${raw.padStart(2, "0")}:00` : raw
        const slot = flow.slots.includes(asTime)
          ? asTime
          : /^\d{1,2}$/.test(raw)
            ? flow.slots[Number(raw) - 1]
            : undefined
        if (!slot) {
          await typeLines(["その時間は選択できません。一覧の番号か時刻で入力してください。"], sessionId)
          return
        }
        setBookingFlow({ ...flow, step: "agenda", timeSlot: slot })
        await typeLines(["相談内容を入力してください。"], sessionId)
        return
      }
      case "agenda": {
        const next = { ...flow, step: "confirm" as const, agenda: raw }
        setBookingFlow(next)
        await typeLines(
          [
            "以下の内容で予約します。",
            `  お名前   : ${next.name}`,
            `  メール   : ${next.email}`,
            `  会社名   : ${next.company || "-"}`,
            `  形式     : ${next.bookingType === "meet" ? "Google Meet" : `対面（${next.location}）`}`,
            `  日時     : ${next.date} ${next.timeSlot}`,
            `  相談内容 : ${next.agenda}`,
            "よろしければ y、やり直す場合は n を入力してください。",
          ],
          sessionId
        )
        return
      }
      case "confirm": {
        const lower = raw.toLowerCase()
        if (lower === "n" || lower === "no") {
          setBookingFlow(null)
          await typeLines(["予約を中断しました。また book でいつでも再開できます。"], sessionId)
          return
        }
        if (lower !== "y" && lower !== "yes") {
          await typeLines(["y か n を入力してください。"], sessionId)
          return
        }
        setBookingFlow({ ...flow, step: "submitting" })
        await typeLines(["予約を送信しています..."], sessionId)
        try {
          const response = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: flow.name,
              email: flow.email,
              company: flow.company || undefined,
              bookingType: flow.bookingType,
              date: flow.date,
              timeSlot: flow.timeSlot,
              agenda: flow.agenda,
              location: flow.location || undefined,
            }),
          })
          const json = await response.json()
          if (!response.ok || !json.ok) {
            setBookingFlow(null)
            await typeLines(
              [
                (json.message as string) || "予約に失敗しました。",
                "book でもう一度やり直せます。",
              ],
              sessionId
            )
            return
          }
          setBookingFlow(null)
          await typeLines(
            [
              "予約が完了しました🎉",
              `  予約番号: ${json.bookingId}`,
              ...(json.meetUrl ? [`  Meet URL: ${json.meetUrl}`] : []),
              ...(json.managePortal
                ? [
                    `  予約者専用ページ: ${json.managePortal.url}`,
                    `  初期パスワード: ${json.managePortal.initialPassword}`,
                  ]
                : []),
              json.mail?.sent
                ? "確認メールをお送りしました。届かない場合は迷惑メールもご確認ください。"
                : "※この環境ではメールは送信されていません。",
            ],
            sessionId
          )
        } catch (error) {
          setBookingFlow(null)
          await typeLines([`予約の送信に失敗しました: ${String(error)}`, "book でもう一度やり直せます。"], sessionId)
        }
        return
      }
      case "submitting":
        return
    }
  }

  const execute = async () => {
    const raw = command.trim()
    const lower = raw.toLowerCase()
    if (!raw || isTyping) return

    const sessionId = Date.now()
    typingSessionRef.current = sessionId
    pushLine("command", `${prompt} ${raw}`)

    if (bookingFlow) {
      setCommand("")
      await handleBookingInput(raw, bookingFlow, sessionId)
      return
    }

    if (lower === "clear") {
      setHistory([])
      setCommand("")
      return
    }

    setCommand("")

    if (lower === "book") {
      await startBookingFlow(sessionId)
      return
    }

    if (lower === "cd") {
      await typeLines(["usage: cd <page>", "例: cd /blog  または cd appointment"], sessionId)
      return
    }

    if (lower.startsWith("cd ")) {
      await handleCd(raw.slice(3), sessionId)
      return
    }

    const outputs = commandMap[lower as keyof typeof commandMap] || [
      `command not found: ${lower}`,
      "help を入力して使えるコマンドを確認してください。",
    ]

    await typeLines(outputs, sessionId)
  }

  const handleTabCompletion = () => {
    if (!command.trim()) return

    const raw = command
    const lower = raw.toLowerCase()

    if (!lower.startsWith("cd ")) {
      const candidates = rootCommands.filter((item) => item.startsWith(lower))
      if (candidates.length === 1) {
        const completed = candidates[0]
        setCommand(completed === "cd" ? "cd " : completed)
      } else if (candidates.length > 1) {
        pushLine("output", candidates.join("  "))
      }
      return
    }

    const rawTarget = raw.slice(3)
    const hasSlash = rawTarget.startsWith("/")
    const hasTilde = rawTarget.startsWith("~/")
    const normalizedPrefix = rawTarget.trim().toLowerCase().replace(/^~\//, "").replace(/^\/+/, "")
    const candidates = cdTargets.filter((item) => item.startsWith(normalizedPrefix))

    if (candidates.length === 1) {
      const target = candidates[0]
      if (hasTilde) {
        setCommand(`cd ~/${target}`)
      } else if (hasSlash) {
        setCommand(`cd /${target}`)
      } else {
        setCommand(`cd ${target}`)
      }
    } else if (candidates.length > 1) {
      pushLine("output", candidates.map((item) => `/${item}`).join("  "))
    }
  }

  return (
    <main
      className={
        mode === "terminal"
          ? "min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-black dark:text-slate-100"
          : "min-h-screen bg-background text-foreground"
      }
    >
      <section
        className={
          mode === "terminal"
            ? "min-h-[calc(100vh-4rem)] w-full px-0 pb-0 pt-4"
            : "mx-auto max-w-6xl px-4 pb-20 pt-24"
        }
      >
        {mode === "terminal" ? (
          <section
            className="min-h-[calc(100vh-11rem)] w-full rounded-none border-y border-border/40 bg-white/80 p-4 shadow-xl shadow-slate-300/25 dark:bg-black/80 dark:shadow-black/20"
            onClick={() => terminalInputRef.current?.focus()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-400/10 p-1">
                <button
                  type="button"
                  onClick={() => setMode("terminal")}
                  aria-label="Terminal Mode"
                  title="Terminal Mode"
                  className={`rounded px-2 py-1 text-xs ${mode === "terminal" ? "bg-emerald-500/30 text-emerald-100" : "text-emerald-300/80"}`}
                >
                  &gt;_
                </button>
                <button
                  type="button"
                  onClick={() => setMode("ui")}
                  aria-label="UI Mode"
                  title="UI Mode"
                  className={`rounded px-2 py-1 text-xs ${mode === "ui" ? "bg-cyan-500/30 text-cyan-100" : "text-cyan-300/80"}`}
                >
                  [ ]
                </button>
              </div>
            </div>
            <div className="space-y-1 font-mono text-sm">
              <pre className="mb-4 overflow-x-auto border border-emerald-400/30 bg-emerald-400/5 p-3 text-[8px] leading-tight text-emerald-300 md:text-[11px]">
                {terminalTitleArt}
              </pre>
              {history.map((line) => (
                <p key={line.id} className={line.kind === "command" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}>
                  {line.text}
                </p>
              ))}
              <label className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
                <span className="hidden sm:inline">{prompt}</span>
                <span className="sm:hidden text-xs">dokkiitech$</span>
                <input
                  ref={terminalInputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key.toLowerCase() === "c" && (isTyping || bookingFlow)) {
                      e.preventDefault()
                      typingSessionRef.current = Date.now()
                      setIsTyping(false)
                      pushLine("output", "^C")
                      if (bookingFlow) {
                        setBookingFlow(null)
                        pushLine("output", "予約を中断しました。また book でいつでも再開できます。")
                      }
                      return
                    }
                    if (e.ctrlKey && e.key.toLowerCase() === "l") {
                      e.preventDefault()
                      setHistory([])
                      setCommand("")
                      return
                    }
                    if (e.key === "Enter") {
                      // IME 変換確定の Enter をコマンド実行として拾わない
                      if (e.nativeEvent.isComposing || e.keyCode === 229) return
                      void execute()
                      return
                    }
                    if (e.key === "Tab") {
                      e.preventDefault()
                      handleTabCompletion()
                    }
                  }}
                  className="w-full bg-transparent text-base text-foreground outline-none md:text-sm"
                  placeholder={
                    bookingFlow ? bookingPlaceholders[bookingFlow.step] : isTyping ? "出力中..." : "例: cd /blog"
                  }
                />
              </label>
              <div ref={terminalBottomRef} />
            </div>
          </section>
        ) : (
          <section className="space-y-8 pt-2">
            <div className="flex justify-end">
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setMode("terminal")}
                  aria-label="Terminal Mode"
                  title="Terminal Mode"
                  className={`rounded px-2 py-1 text-xs ${mode === "terminal" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
                >
                  &gt;_
                </button>
                <button
                  type="button"
                  onClick={() => setMode("ui")}
                  aria-label="UI Mode"
                  title="UI Mode"
                  className={`rounded px-2 py-1 text-xs ${mode === "ui" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
                >
                  [ ]
                </button>
              </div>
            </div>
            <article id="profile" className="rounded-3xl border border-border bg-card p-7 shadow-sm">
              <p className="text-xs tracking-[0.25em] text-cyan-300">PROFILE</p>
              <h2 className="mt-2 text-3xl font-bold">木戸亮輔 / DOKKIITECH</h2>
              <div className="mt-4 max-w-3xl space-y-2 text-muted-foreground">
                <p>初めまして或いはこんにちは。木戸です。28卒の学生エンジニアです。</p>
                <p>主領域はバックエンドです。その他にもインフラ周りやフロントエンドも適度にできる自称フロンエンドエンジニアです。</p>
                <p>様々なIT団体を運営し自身の技術力向上と共に地域のIT文化の活性化をするための活動をしています。</p>
                <p>また自宅サーバー dokkiitech Regionを運営し自身のプロダクトを幅広く更新しています。</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Next.js", "TypeScript", "Go", "Docker", "AWS", "Security"].map((tag) => (
                  <span key={tag} className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                    {tag}
                  </span>
                ))}
              </div>
            </article>

            <div className="grid gap-6 lg:grid-cols-2">
              <article id="blog" className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">ブログ</h2>
                  <a href="https://zenn.dev/dokkiitech" target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
                    Zennで見る
                  </a>
                </div>
                <div className="space-y-3">
                  {blogArticles.slice(0, 4).map((item) => (
                    <a key={item.link} href={item.link} target="_blank" rel="noreferrer" className="block rounded-xl border border-border p-3 transition hover:-translate-y-0.5 hover:bg-muted">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(item.pubDate).toLocaleDateString("ja-JP")}</p>
                    </a>
                  ))}
                </div>
              </article>

              <article id="product" className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Product</h2>
                  <a href="https://zenn.dev/dokkiitech" target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
                    Zennで見る
                  </a>
                </div>
                <div className="space-y-3">
                  {productArticles.slice(0, 4).map((item) => (
                    <a key={item.link} href={item.link} target="_blank" rel="noreferrer" className="block rounded-xl border border-border p-3 transition hover:-translate-y-0.5 hover:bg-muted">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(item.pubDate).toLocaleDateString("ja-JP")}</p>
                    </a>
                  ))}
                </div>
              </article>
            </div>

            <article id="sns" className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-semibold">各種SNSリンク</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {snsLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
                    className="rounded-xl border border-border bg-card px-4 py-3 transition hover:border-cyan-400/50 hover:bg-muted"
                  >
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.label === "Email" ? "info@dokkiitech.com" : "@dokkiitech"}
                    </p>
                  </a>
                ))}
              </div>
            </article>

            <article id="booking" className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-3 text-2xl font-semibold">予約</h2>
              <p className="text-muted-foreground">
                打ち合わせ予約は `meet / 対面` に対応しています。対面の場合は場所指定ありで調整します。
                連絡は `info@dokkiitech.com` でも可能です。
              </p>
              <Link href="/appointment" className="mt-4 inline-block rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-cyan-100">
                予約フォームを開く
              </Link>
            </article>
          </section>
        )}
      </section>
    </main>
  )
}
