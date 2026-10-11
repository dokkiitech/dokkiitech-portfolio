"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { isExternalHref, navigationItems, socialLinks } from "@/lib/site"

export function SiteFooter() {
  const pathname = usePathname()
  // ホームはターミナルが全画面、予約系は画面いっぱいのアプリ UI なのでフッターを出さない
  if (pathname === "/" || pathname?.startsWith("/appointment")) return null

  return (
    <footer className="mt-16 border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center font-mono text-sm font-semibold">
            <span className="text-primary">~/</span>dokkiitech
          </Link>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            木戸亮輔のポートフォリオ。お仕事・ご相談は予約ページからどうぞ。
          </p>
          <ul className="flex items-center gap-1">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  aria-label={label}
                  target={isExternalHref(href) ? "_blank" : undefined}
                  rel={isExternalHref(href) ? "noreferrer" : undefined}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="フッター">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
            {[...navigationItems, { name: "プライバシーポリシー", href: "/privacy-policy" }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border/70">
        <p className="mx-auto max-w-6xl px-4 py-5 font-mono text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} DOKKIITECH — <span className="text-primary">exit 0</span>
        </p>
      </div>
    </footer>
  )
}
