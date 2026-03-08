"use client"

import { useEffect, useMemo, useState } from "react"

const prompt = "dokkiitech@portfolio:~$"

export default function Loading() {
  const logs = useMemo(
    () => [
      `${prompt} dokkiitech Portfolio building...`,
      "frontend_1  | Pulling from library/node",
      "frontend_1  | 8c7716127147: Pulling fs layer",
      "frontend_1  | 8c7716127147: Downloading [=======>                     ]  14.2MB/58.0MB",
      "frontend_1  | 8c7716127147: Download complete",
      "frontend_1  | 8c7716127147: Extracting [=================>           ]  32.1MB/58.0MB",
      "frontend_1  | 8c7716127147: Pull complete",
      "backend_1   | Pulling from library/golang",
      "backend_1   | a12f4b8de019: Pulling fs layer",
      "backend_1   | a12f4b8de019: Downloading [==========>                 ]  41.8MB/102MB",
      "backend_1   | a12f4b8de019: Download complete",
      "backend_1   | a12f4b8de019: Extracting [======================>      ]  76.4MB/102MB",
      "backend_1   | a12f4b8de019: Pull complete",
      "frontend_1  | pnpm install --frozen-lockfile",
      "frontend_1  | pnpm build (Next.js 15)",
      "backend_1   | go mod download",
      "backend_1   | go build ./cmd/api",
      "[+] Running 3/3",
      " ✔ Container portfolio_frontend  Started",
      " ✔ Container portfolio_backend   Started",
      " ✔ Container portfolio_nginx     Started",
      `${prompt} complete🎉`,
    ],
    []
  )

  const [visibleCount, setVisibleCount] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= logs.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 220)
    return () => clearInterval(interval)
  }, [logs.length])

  return (
    <main className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-slate-100">
      <section className="h-full w-full border border-slate-700 bg-slate-950 p-6 font-mono text-sm md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="space-y-1">
          {logs.slice(0, visibleCount).map((line, index) => (
            <p key={`${line}-${index}`} className="whitespace-pre-wrap break-words text-emerald-300">
              {line}
            </p>
          ))}
        </div>
      </section>
    </main>
  )
}
