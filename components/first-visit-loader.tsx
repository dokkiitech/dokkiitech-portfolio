"use client"

import { useEffect, useMemo, useState } from "react"

const prompt = "dokkiitech@portfolio:~$"

export function FirstVisitLoader() {
  const [show, setShow] = useState(false)
  const [closing, setClosing] = useState(false)
  const [visibleCount, setVisibleCount] = useState(1)

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

  useEffect(() => {
    setShow(true)

    const intervalMs = 260
    const lineTimer = setInterval(() => {
      setVisibleCount((prev) => Math.min(prev + 1, logs.length))
    }, intervalMs)

    const hideTimer = setTimeout(() => {
      setClosing(true)
      setTimeout(() => {
        setShow(false)
        setClosing(false)
      }, 360)
    }, intervalMs * logs.length + 1000)

    return () => {
      clearInterval(lineTimer)
      clearTimeout(hideTimer)
    }
  }, [logs.length])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[10000] bg-black p-6 font-mono text-sm text-emerald-300 transition-all duration-300 md:p-8 ${
        closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
      </div>
      <div className="space-y-1">
        {logs.slice(0, visibleCount).map((line, idx) => (
          <p key={`${line}-${idx}`} className="whitespace-pre-wrap break-words">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
