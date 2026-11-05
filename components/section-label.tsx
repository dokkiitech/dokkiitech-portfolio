import type { ReactNode } from "react"

// カード見出しの上に置く「$ command」風ラベル
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs text-primary">
      <span className="text-muted-foreground">$</span> {children}
    </p>
  )
}
