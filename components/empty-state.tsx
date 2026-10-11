import type { ReactNode } from "react"

export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <p className="font-mono text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  )
}
