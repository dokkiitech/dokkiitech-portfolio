"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { navigationItems } from "@/lib/site"
import { cn } from "@/lib/utils"
import { CalendarClock, Menu, X } from "lucide-react"

const bookingItem = navigationItems.find((item) => item.href === "/appointment")!
const pageItems = navigationItems.filter((item) => item !== bookingItem)

const isActive = (pathname: string | null, href: string) =>
  href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false)

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // ページ遷移したらモバイルメニューを閉じる
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // メニュー表示中は背面のスクロールを止め、Esc で閉じられるようにする
  useEffect(() => {
    if (!isOpen) return
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-border/70 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex items-center font-mono text-[15px] font-semibold tracking-tight" aria-label="DOKKIITECH ホーム">
            <span className="text-primary">~/</span>
            <span>dokkiitech</span>
            <span aria-hidden className="ml-1 inline-block h-4 w-2 translate-y-px bg-primary animate-caret" />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {pageItems.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.name}
                    {active && <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild size="sm" className="hidden rounded-full px-4 md:inline-flex">
              <Link href={bookingItem.href} aria-current={isActive(pathname, bookingItem.href) ? "page" : undefined}>
                <CalendarClock />
                予約する
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              onClick={() => setIsOpen((open) => !open)}
              aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* モバイルメニュー: ターミナルの ls 出力風に番号付きで並べる */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-40 bg-background/95 pt-16 backdrop-blur-xl transition-opacity duration-200 md:hidden",
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col px-6 pb-10 pt-8">
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">dokkiitech@portfolio</span>:~$ ls
          </p>
          <ul className="mt-4 space-y-1">
            {pageItems.map((item, index) => {
              const active = isActive(pathname, item.href)
              return (
                <li
                  key={item.href}
                  className={cn("transition-all duration-300", isOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
                  style={{ transitionDelay: isOpen ? `${index * 40}ms` : "0ms" }}
                >
                  <Link
                    href={item.href}
                    tabIndex={isOpen ? undefined : -1}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-baseline gap-4 rounded-lg px-2 py-3 text-2xl font-semibold transition-colors",
                      active ? "text-primary" : "text-foreground hover:text-primary"
                    )}
                  >
                    <span className="w-6 font-mono text-xs font-normal text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
          <Button asChild size="lg" className="mt-auto h-12 rounded-full text-base" tabIndex={isOpen ? undefined : -1}>
            <Link href={bookingItem.href}>
              <CalendarClock />
              {bookingItem.name}
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
