"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { navigation } from "@/lib/site-nav"


function isCurrent(pathname: string, href: string) {
  if (href.startsWith("/#")) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="DOKKIITECH トップページ">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-horizontal.svg" alt="DOKKIITECH" width={196} height={36} className="h-8 w-auto md:h-9" />
        </Link>

        <nav aria-label="グローバルナビゲーション" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => {
              const current = isCurrent(pathname, item.href)
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`relative block rounded px-3 py-2 text-[0.9375rem] font-bold hover:text-brand hover:underline hover:underline-offset-4 ${
                      current
                        ? "text-brand after:absolute after:inset-x-3 after:-bottom-[13px] after:h-1 after:bg-brand"
                        : "text-gray-900"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/appointment" className="btn-primary hidden !min-h-10 !px-4 !py-2 text-[0.9375rem] sm:inline-flex">
            無料相談を予約
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 flex-col items-center justify-center rounded border border-transparent px-2 text-gray-900 hover:bg-gray-50 lg:hidden"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            <span className="text-[0.625rem] font-bold leading-none">{isOpen ? "閉じる" : "メニュー"}</span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!isOpen}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-gray-200 bg-white lg:hidden"
      >
        <nav aria-label="モバイルナビゲーション" className="mx-auto max-w-7xl px-4 pb-6 pt-2">
          <ul className="divide-y divide-gray-200">
            <li>
              <Link href="/" className="block py-4 text-base font-bold text-gray-900 hover:text-brand">
                トップ
              </Link>
            </li>
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  className="block py-4 text-base font-bold text-gray-900 hover:text-brand aria-[current=page]:text-brand"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/appointment" className="btn-primary mt-4 w-full">
            無料相談を予約
          </Link>
        </nav>
      </div>
    </header>
  )
}
