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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function PortfolioExperience({ blogArticles, productArticles, focusStack }: PortfolioExperienceProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("terminal")
  const [history, setHistory] = useState<TerminalLine[]>([])
  const [command, setCommand] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const lineIdRef = useRef(0)
  const typingSessionRef = useRef(0)
  const terminalInputRef = useRef<HTMLInputElement | null>(null)

  const commandMap = useMemo(
    () => ({
      help: ["利用可能: help, ls, profile, blog, product, sns, booking, cd <page>, clear"],
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
        "SNS ID:",
        "[X]          @dokkiitech",
        "[Instagram]  @dokkiitech",
        "[Zenn]       @dokkiitech",
        "[GitHub]     @dokkiitech",
      ],
      blog: blogArticles.slice(0, 3).map((item) => `- ${item.title}`),
      product: productArticles.slice(0, 3).map((item) => `- ${item.title}`),
      sns: snsLinks.map((item) => `- ${item.label}: ${item.href}`),
      booking: ["予約ページ: /appointment", "cd booking で移動できます。"],
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
      ].join("\n"),
    []
  )
  const terminalLabelDesktop = "▓▓▓▓▓  PORTFOLIO TERMINAL  ▓▓▓▓▓"
  const terminalLabelMobile = "▓▓▓▓▓  PORTFOLIO\n▓▓▓▓▓  TERMINAL"

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

  const execute = async () => {
    const raw = command.trim()
    const lower = raw.toLowerCase()
    if (!raw || isTyping) return

    const sessionId = Date.now()
    typingSessionRef.current = sessionId
    pushLine("command", `${prompt} ${raw}`)

    if (lower === "clear") {
      setHistory([])
      setCommand("")
      return
    }

    if (lower.startsWith("cd ")) {
      await handleCd(raw.slice(3), sessionId)
      setCommand("")
      return
    }

    const outputs = commandMap[lower as keyof typeof commandMap] || [
      `command not found: ${lower}`,
      "help を入力して使えるコマンドを確認してください。",
    ]

    await typeLines(outputs, sessionId)
    setCommand("")
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
            className="h-[calc(100vh-11rem)] w-full rounded-none border-y border-border/40 bg-white/80 p-4 shadow-xl shadow-slate-300/25 dark:bg-black/80 dark:shadow-black/20"
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
              <pre className="mb-3 overflow-x-auto border border-emerald-600/40 bg-emerald-500/10 p-3 text-[5px] leading-tight text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/5 dark:text-emerald-300 sm:text-[7px] md:text-[10px]">
                {terminalTitleArt}
              </pre>
              <pre className="mb-4 hidden text-center font-mono text-sm leading-tight tracking-[0.24em] text-emerald-700 dark:text-emerald-300 md:block">{terminalLabelDesktop}</pre>
              <pre className="mb-4 text-center font-mono text-xs leading-tight tracking-[0.2em] text-emerald-700 dark:text-emerald-300 md:hidden">{terminalLabelMobile}</pre>
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
                    if (e.key === "Enter") {
                      void execute()
                    }
                  }}
                  className="w-full bg-transparent text-base text-foreground outline-none md:text-sm"
                  placeholder={isTyping ? "出力中..." : "例: cd /blog"}
                />
              </label>
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
