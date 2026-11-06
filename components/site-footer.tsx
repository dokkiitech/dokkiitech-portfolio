import Link from "next/link"
import { navigation } from "@/lib/site-nav"

const socials = [
  { name: "GitHub", href: "https://github.com/dokkiitech" },
  { name: "Zenn", href: "https://zenn.dev/dokkiitech" },
  { name: "X", href: "https://x.com/dokkiitech" },
  { name: "Instagram", href: "https://instagram.com/dokkiitech" },
]

export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-horizontal-white.svg" alt="DOKKIITECH" width={220} height={40} className="h-10 w-auto" />
          <dl className="mt-6 space-y-1 text-sm leading-7 text-gray-200">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-gray-400">屋号</dt>
              <dd>dokkiitech（ドッキーテック）</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-gray-400">代表</dt>
              <dd>木戸 亮輔</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-gray-400">所在地</dt>
              <dd>福岡県北九州市小倉北区</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-gray-400">連絡先</dt>
              <dd>
                <a href="mailto:info@dokkiitech.com" className="underline underline-offset-4 hover:decoration-2">
                  info@dokkiitech.com
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <nav aria-label="フッターナビゲーション">
          <p className="text-sm font-bold text-gray-400">サイトマップ</p>
          <ul className="mt-4 space-y-3 text-sm">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href} className="hover:underline hover:underline-offset-4">
                  {item.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/appointment" className="hover:underline hover:underline-offset-4">
                ご相談の予約
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-sm font-bold text-gray-400">SNS</p>
          <ul className="mt-4 space-y-3 text-sm">
            {socials.map((item) => (
              <li key={item.name}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:underline hover:underline-offset-4">
                  {item.name}
                  <span className="sr-only">（新しいタブで開きます）</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-gray-400 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-white hover:underline">
              プライバシーポリシー
            </Link>
            <Link href="/terminal" className="hover:text-white hover:underline">
              Terminal Mode
            </Link>
          </div>
          <p>© {new Date().getFullYear()} dokkiitech</p>
        </div>
      </div>
    </footer>
  )
}
