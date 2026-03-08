"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { ZennArticle } from "@/lib/zenn"

type Mode = "terminal" | "ui"

interface PortfolioExperienceProps {
  blogArticles: ZennArticle[]
  productArticles: ZennArticle[]
}

interface TerminalLine {
  id: number
  kind: "command" | "output"
  text: string
}

const prompt = "dokkii@portfolio:~$"
const snsLinks = [
  { label: "X", href: "https://x.com/dokkiitech" },
  { label: "GitHub", href: "https://github.com/dokkiitech" },
  { label: "Zenn", href: "https://zenn.dev/dokkiitech" },
]

export function PortfolioExperience({ blogArticles, productArticles }: PortfolioExperienceProps) {
  const [mode, setMode] = useState<Mode>("ui")
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: 1, kind: "output", text: "Portfolio terminalへようこそ。`help` でコマンド一覧を表示できます。" },
  ])
  const [command, setCommand] = useState("")

  const commandMap = useMemo(
    () => ({
      help: [
        "利用可能コマンド: help, profile, blog, product, sns, booking, clear",
      ],
      profile: [
        "木戸亮輔 / DOKKIITECH",
        "Webアプリ開発・プロダクト設計・技術発信を中心に活動中。",
      ],
      blog: blogArticles.slice(0, 3).map((item) => `- ${item.title}`),
      product: productArticles.slice(0, 3).map((item) => `- ${item.title}`),
      sns: snsLinks.map((item) => `- ${item.label}: ${item.href}`),
      booking: ["予約ページ: /appoint"],
    }),
    [blogArticles, productArticles]
  )

  const execute = () => {
    const trimmed = command.trim().toLowerCase()
    if (!trimmed) return

    if (trimmed === "clear") {
      setHistory([])
      setCommand("")
      return
    }

    const outputs = commandMap[trimmed as keyof typeof commandMap] || [
      `command not found: ${trimmed}`,
      "help を入力して使えるコマンドを確認してください。",
    ]

    setHistory((prev) => [
      ...prev,
      { id: Date.now(), kind: "command", text: `${prompt} ${trimmed}` },
      ...outputs.map((text, idx) => ({ id: Date.now() + idx + 1, kind: "output" as const, text })),
    ])
    setCommand("")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-24">
        <header className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">DOKKIITECH Portfolio</h1>
            <div className="inline-flex rounded-lg border border-slate-600 p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("terminal")}
                className={`rounded-md px-3 py-1 ${mode === "terminal" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-300"}`}
              >
                Terminal Mode
              </button>
              <button
                type="button"
                onClick={() => setMode("ui")}
                className={`rounded-md px-3 py-1 ${mode === "ui" ? "bg-sky-500/20 text-sky-300" : "text-slate-300"}`}
              >
                UI Mode
              </button>
            </div>
          </div>
        </header>

        {mode === "terminal" ? (
          <section className="rounded-2xl border border-slate-700 bg-black/70 p-4 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="space-y-1 font-mono text-sm">
              {history.map((line) => (
                <p key={line.id} className={line.kind === "command" ? "text-emerald-300" : "text-slate-200"}>
                  {line.text}
                </p>
              ))}
              <label className="flex items-center gap-2 text-emerald-300">
                <span>{prompt}</span>
                <input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") execute()
                  }}
                  className="w-full bg-transparent text-slate-100 outline-none"
                  placeholder="コマンドを入力"
                />
              </label>
            </div>
          </section>
        ) : (
          <section className="space-y-10">
            <article id="profile" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
              <h2 className="mb-3 text-2xl font-semibold">プロフィール</h2>
              <p className="text-slate-300">
                木戸亮輔（DOKKIITECH）。Webアプリ開発とプロダクトづくりを軸に活動し、技術ナレッジをZennで発信しています。
              </p>
            </article>

            <article id="blog" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
              <h2 className="mb-3 text-2xl font-semibold">ブログ</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {blogArticles.slice(0, 4).map((item) => (
                  <a key={item.link} href={item.link} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 p-3 hover:bg-slate-800">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.pubDate).toLocaleDateString("ja-JP")}</p>
                  </a>
                ))}
              </div>
              <Link href="/blog" className="mt-4 inline-block text-sky-300 underline">
                すべて見る
              </Link>
            </article>

            <article id="product" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
              <h2 className="mb-3 text-2xl font-semibold">Product</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {productArticles.slice(0, 4).map((item) => (
                  <a key={item.link} href={item.link} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 p-3 hover:bg-slate-800">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.pubDate).toLocaleDateString("ja-JP")}</p>
                  </a>
                ))}
              </div>
              <Link href="/products" className="mt-4 inline-block text-sky-300 underline">
                Product一覧へ
              </Link>
            </article>

            <article id="sns" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
              <h2 className="mb-3 text-2xl font-semibold">各種SNSリンク</h2>
              <ul className="space-y-2 text-slate-300">
                {snsLinks.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noreferrer" className="underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        )}
      </section>
    </main>
  )
}
