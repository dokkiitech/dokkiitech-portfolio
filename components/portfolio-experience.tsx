"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowUpRight, CalendarClock, LayoutGrid, SquareTerminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionLabel } from "@/components/section-label"
import type { ZennArticle } from "@/lib/zenn"
import type { FocusStackItem } from "@/lib/github"
import { isExternalHref, socialLinks } from "@/lib/site"
import { cn } from "@/lib/utils"

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
  date: "例: 2026-09-01 / 2026/9/1 / 9/1",
  slot: "番号 または HH:MM",
  agenda: "相談内容を入力",
  confirm: "y / n",
  submitting: "送信中...",
}

const prompt = "dokkiitech@portfolio:~$"
// 非エンジニアでもタップだけで触れるよう、よく使うコマンドをチップで出す
const quickCommands = ["help", "profile", "blog", "product", "contact", "book"] as const
const profileTags = ["Next.js", "TypeScript", "Go", "Docker", "AWS", "Security"]

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

// 多様な日付表記(2026-09-01 / 2026/9/1 / 20260901 / 2026年9月1日 / 9/1 など)を YYYY-MM-DD に正規化
function normalizeDateInput(raw: string): string | null {
  const s = raw.trim().replace(/年|月/g, "-").replace(/日/g, "").replace(/[./]/g, "-").replace(/-+$/, "")

  let year: number
  let month: number
  let day: number

  if (/^\d{8}$/.test(s)) {
    year = Number(s.slice(0, 4))
    month = Number(s.slice(4, 6))
    day = Number(s.slice(6, 8))
  } else if (/^\d{3,4}$/.test(s)) {
    // MDD / MMDD(年省略、今年扱い)。"2026" のような年単独は月の妥当性チェックで弾かれる
    const monthLen = s.length - 2
    year = new Date().getFullYear()
    month = Number(s.slice(0, monthLen))
    day = Number(s.slice(monthLen))
  } else {
    const full = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    const short = s.match(/^(\d{1,2})-(\d{1,2})$/)
    if (full) {
      year = Number(full[1])
      month = Number(full[2])
      day = Number(full[3])
    } else if (short) {
      year = new Date().getFullYear()
      month = Number(short[1])
      day = Number(short[2])
    } else {
      return null
    }
  }

  const dt = new Date(Date.UTC(year, month - 1, day))
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

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
      sns: socialLinks.map((item) => `- ${item.label}: ${item.href}`),
      contact: socialLinks.map((item) => `- ${item.label}: ${item.href}`),
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
          await typeLines(["希望日を入力してください。（例: 2026-09-01 / 2026/9/1 / 9/1）"], sessionId)
        }
        return
      }
      case "location": {
        setBookingFlow({ ...flow, step: "date", location: raw })
        await typeLines(["希望日を入力してください。（例: 2026-09-01 / 2026/9/1 / 9/1）※対面は2日前から予約可能です"], sessionId)
        return
      }
      case "date": {
        const normalizedDate = normalizeDateInput(raw)
        if (!normalizedDate) {
          await typeLines(["日付として解釈できません。（例: 2026-09-01 / 2026/9/1 / 20260901）"], sessionId)
          return
        }
        await typeLines([`空き時間を確認しています...`], sessionId)
        const result = await fetchSlotsForDate(normalizedDate, flow.bookingType)
        if (!result.ok) {
          await typeLines([result.message, "別の日付を入力してください。"], sessionId)
          return
        }
        if (result.notice || result.slots.length === 0) {
          await typeLines([result.notice || "この日は空きがありません。", "別の日付を入力してください。"], sessionId)
          return
        }
        setBookingFlow({ ...flow, step: "slot", date: normalizedDate, slots: result.slots })
        await typeLines(
          [
            `空き時間 (${normalizedDate}):`,
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

  const execute = async (input: string = command) => {
    const raw = input.trim()
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


  const runQuickCommand = (value: string) => {
    if (isTyping) return
    setCommand("")
    void execute(value)
    terminalInputRef.current?.focus({ preventScroll: true })
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value))

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background text-foreground">
      <h1 className="sr-only">DOKKIITECH — 木戸亮輔のポートフォリオ</h1>
      {mode === "terminal" ? (
        <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col px-3 py-3 sm:px-6 sm:py-6">
          <div
            className="flex min-h-[calc(100dvh-5.5rem)] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_80px_-32px_hsl(var(--primary)/0.35)] sm:min-h-[calc(100dvh-7rem)] dark:bg-[hsl(220_16%_5%)]"
            onClick={(e) => {
              // テキスト選択中やボタン押下時はフォーカスを奪わない
              if ((e.target as HTMLElement).closest("button") || window.getSelection()?.toString()) return
              terminalInputRef.current?.focus({ preventScroll: true })
            }}
          >
            <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 sm:px-4">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <p className="flex-1 truncate text-center font-mono text-xs text-muted-foreground">
                <span className="hidden sm:inline">dokkiitech@portfolio: </span>~ — zsh
              </p>
              <ModeToggle mode={mode} onChange={setMode} />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-6 sm:px-6 sm:py-5 sm:text-sm">
              <pre
                aria-label="DOKKIITECH"
                className="font-ascii mb-5 overflow-x-hidden text-[6.5px] leading-tight text-primary min-[400px]:text-[7px] sm:text-[10px] md:text-[12px]"
              >
                {terminalTitleArt}
              </pre>
              <div role="log" aria-live="polite" className="space-y-0.5">
                {history.map((line) => (
                  <p
                    key={line.id}
                    className={cn(
                      "whitespace-pre-wrap break-words",
                      line.kind === "command" ? "mt-2 text-primary first:mt-0" : "text-foreground/85"
                    )}
                  >
                    {line.text || " "}
                  </p>
                ))}
              </div>
              <label className="mt-2 flex items-center gap-2">
                <span className="shrink-0">
                  <span className="text-primary">
                    <span className="hidden sm:inline">dokkiitech@portfolio</span>
                    <span className="sm:hidden">dokkiitech</span>
                  </span>
                  <span className="text-muted-foreground">:~$</span>
                </span>
                <span className="sr-only">コマンドを入力</span>
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
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  className="w-full min-w-0 bg-transparent text-base text-foreground caret-primary outline-none placeholder:text-muted-foreground/60 md:text-sm"
                  placeholder={
                    bookingFlow ? bookingPlaceholders[bookingFlow.step] : isTyping ? "出力中..." : "例: cd /blog"
                  }
                />
              </label>
              <div ref={terminalBottomRef} />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-muted/30 px-3 py-2.5 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] sm:px-4 sm:[mask-image:none]">
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {bookingFlow ? "予約中:" : "タップで実行:"}
              </span>
              {(bookingFlow ? (["cancel"] as const) : quickCommands).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => runQuickCommand(item)}
                  disabled={isTyping}
                  className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-muted-foreground">
              <span className="text-primary">dokkiitech@portfolio</span>:~$ open --ui
            </p>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <article id="profile" className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-2">
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <SectionLabel>whoami</SectionLabel>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                木戸亮輔<span className="ml-3 align-middle font-mono text-base font-medium text-muted-foreground sm:text-lg">/ DOKKIITECH</span>
              </h2>
              <div className="mt-5 max-w-2xl space-y-2 leading-7 text-muted-foreground">
                <p>初めまして或いはこんにちは。木戸です。28卒の学生エンジニアです。</p>
                <p>主領域はバックエンドです。その他にもインフラ周りやフロントエンドも適度にできる自称フロンエンドエンジニアです。</p>
                <p>様々なIT団体を運営し自身の技術力向上と共に地域のIT文化の活性化をするための活動をしています。</p>
                <p>また自宅サーバー dokkiitech Regionを運営し自身のプロダクトを幅広く更新しています。</p>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {profileTags.map((tag) => (
                  <li key={tag} className="rounded-md border border-primary/25 bg-accent px-2.5 py-1 font-mono text-xs text-accent-foreground">
                    {tag}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/appointment">
                    <CalendarClock />
                    お打ち合わせを予約
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/profile">
                    プロフィール詳細
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-6">
              <SectionLabel>stack</SectionLabel>
              <h2 className="mt-3 text-lg font-semibold">GitHub の言語比率</h2>
              {focusStack.length > 0 ? (
                <ul className="mt-5 space-y-3.5">
                  {focusStack.map((item) => (
                    <li key={item.language}>
                      <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs">
                        <span>{item.language}</span>
                        <span className="tabular-nums text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(item.percentage, 2)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">現在データを取得できません。</p>
              )}
            </article>

            <ArticleList id="blog" label="blog" title="ブログ" href="/blog" articles={blogArticles} formatDate={formatDate} emptyText="記事を読み込めませんでした。" />
            <ArticleList
              id="product"
              label="products"
              title="Product"
              href="/products"
              articles={productArticles}
              formatDate={formatDate}
              emptyText="プロダクト紹介を準備中です。"
            />

            <article id="sns" className="rounded-2xl border border-border bg-card p-6">
              <SectionLabel>contact</SectionLabel>
              <h2 className="mt-3 text-lg font-semibold">SNS</h2>
              <ul className="mt-4 space-y-1">
                {socialLinks.map(({ label, href, handle, icon: Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target={isExternalHref(href) ? "_blank" : undefined}
                      rel={isExternalHref(href) ? "noreferrer" : undefined}
                      className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="ml-auto truncate font-mono text-xs text-muted-foreground">{handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </article>

            <article
              id="booking"
              className="relative overflow-hidden rounded-2xl border border-primary/30 bg-accent/60 p-6 sm:p-8 lg:col-span-3"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <SectionLabel>book</SectionLabel>
                  <h2 className="mt-3 text-xl font-semibold sm:text-2xl">お打ち合わせのご予約</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    Google Meet・対面のどちらにも対応しています（対面の場合は場所を指定して調整します）。メール（info@dokkiitech.com）でのご連絡も歓迎です。
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0 rounded-full">
                  <Link href="/appointment">
                    予約フォームを開く
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  )
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const options = [
    { value: "terminal" as const, label: "Terminal", icon: SquareTerminal },
    { value: "ui" as const, label: "UI", icon: LayoutGrid },
  ]
  return (
    <div role="group" aria-label="表示モード" className="inline-flex shrink-0 items-center rounded-lg border border-border bg-background p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={mode === value}
          aria-label={`${label} Mode`}
          title={`${label} Mode`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            mode === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

function ArticleList({
  id,
  label,
  title,
  href,
  articles,
  formatDate,
  emptyText,
}: {
  id: string
  label: string
  title: string
  href: string
  articles: ZennArticle[]
  formatDate: (value: string) => string
  emptyText: string
}) {
  return (
    <article id={id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>{label}</SectionLabel>
          <h2 className="mt-3 text-lg font-semibold">{title}</h2>
        </div>
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
          すべて見る
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {articles.length > 0 ? (
        <ul className="mt-4 divide-y divide-border">
          {articles.slice(0, 4).map((item) => (
            <li key={item.link}>
              <a href={item.link} target="_blank" rel="noreferrer" className="group flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-6 transition-colors group-hover:text-primary">{item.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{formatDate(item.pubDate)}</p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-4 py-10">
          <p className="font-mono text-xs text-muted-foreground">{emptyText}</p>
        </div>
      )}
    </article>
  )
}
