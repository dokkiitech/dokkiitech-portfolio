"use client"

import { useEffect, useMemo, useState } from "react"

const prompt = "dokkiitech@portfolio:~$"

export default function Loading() {
  const logs = useMemo(
    () => [
      `${prompt} dokkiitech Portfolio building...`,
      "[+] Building 6.4s (14/14) FINISHED",
      " => [frontend 1/6] FROM node:22-alpine",
      " => [frontend 2/6] WORKDIR /app",
      " => [frontend 3/6] COPY package.json pnpm-lock.yaml ./",
      " => [frontend 4/6] RUN pnpm install --frozen-lockfile",
      " => [frontend 5/6] COPY . .",
      " => [frontend 6/6] RUN pnpm build (Next.js 15)",
      " => [backend 1/5] FROM golang:1.24-alpine",
      " => [backend 2/5] WORKDIR /src",
      " => [backend 3/5] COPY go.mod go.sum ./",
      " => [backend 4/5] RUN go mod download",
      " => [backend 5/5] RUN CGO_ENABLED=0 go build ./cmd/api",
      " => [worker 1/3] installing redis, nginx, grpc gateway",
      " => exporting to image",
      " => naming to dokkiitech/portfolio:latest",
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
    }, 120)
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
