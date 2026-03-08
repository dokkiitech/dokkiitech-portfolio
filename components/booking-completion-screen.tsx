"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BookingCompletionScreenProps {
  title: string
  detail?: string
  infoLines?: string[]
  description: string
  actionLabel: string
  onAction: () => void
}

export function BookingCompletionScreen({
  title,
  detail,
  infoLines,
  description,
  actionLabel,
  onAction,
}: BookingCompletionScreenProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.45)]">
          <Check className="h-12 w-12 animate-bounce text-white" strokeWidth={3.5} />
        </div>
        <h1 className="animate-fade-in text-4xl font-bold">{title}</h1>
        {detail ? <p className="mt-4 text-muted-foreground">{detail}</p> : null}
        {infoLines && infoLines.length > 0 ? (
          <div className="mt-4 w-full max-w-md rounded-lg border border-border bg-card p-4 text-left text-sm">
            <p className="mb-2 font-semibold">現在の予約情報</p>
            <ul className="space-y-1 text-muted-foreground">
              {infoLines.map((line, idx) => (
                <li key={`${line}-${idx}`}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Button className="mt-8" onClick={onAction}>
          {actionLabel}
        </Button>
      </section>
    </main>
  )
}
