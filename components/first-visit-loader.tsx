"use client"

import { useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "dokkiitech_portfolio_first_visit_done_v1"
const prompt = "dokkiitech@portfolio:~$"

export function FirstVisitLoader() {
  const [show, setShow] = useState(false)
  const [visibleCount, setVisibleCount] = useState(1)

  const logs = useMemo(
    () => [
      `${prompt} dokkiitech Portfolio building...`,
      "[+] Building 6.4s (14/14) FINISHED",
      " => [frontend] Next.js app build",
      " => [backend] Go API build",
      " => [deps] redis/nginx/grpc-gateway setup",
      " => exporting image dokkiitech/portfolio:latest",
      `${prompt} complete🎉`,
    ],
    []
  )

  useEffect(() => {
    const done = window.localStorage.getItem(STORAGE_KEY)
    if (done === "1") return

    setShow(true)
    window.localStorage.setItem(STORAGE_KEY, "1")

    const lineTimer = setInterval(() => {
      setVisibleCount((prev) => Math.min(prev + 1, logs.length))
    }, 180)

    const hideTimer = setTimeout(() => {
      setShow(false)
    }, 2400)

    return () => {
      clearInterval(lineTimer)
      clearTimeout(hideTimer)
    }
  }, [logs.length])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[10000] bg-black p-6 font-mono text-sm text-emerald-300 md:p-8">
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
