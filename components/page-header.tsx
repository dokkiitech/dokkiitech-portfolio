import type React from "react"

interface PageHeaderProps {
  /** ターミナル風アイブロウに出すパス（例: "/blog"） */
  path: string
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}

// 各ページ共通のヘッダー。ホームのターミナルと同じ「$ cd <path>」の語彙でページを名乗る
export function PageHeader({ path, title, description, children }: PageHeaderProps) {
  return (
    <header className="relative isolate overflow-hidden border-b border-border/70">
      <div
        aria-hidden
        className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_100%_at_0%_0%,black,transparent_75%)]"
      />
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
        <p className="font-mono text-xs text-muted-foreground sm:text-sm">
          <span className="text-primary">dokkiitech@portfolio</span>:~$ cd {path}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && <div className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</div>}
        {children && <div className="mt-5 flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </header>
  )
}
