"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X } from "lucide-react"

const navigation = [
  { name: "ホーム", href: "/" },
  { name: "プロフィール", href: "/profile" },
  { name: "ブログ", href: "/blog" },
  { name: "Product", href: "/products" },
  { name: "SNS", href: "/contact" },
  { name: "予約", href: "/appointment" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* ロゴ */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {"<>"}
              </span>
              <span className="font-bold text-lg">dokkiitech.com</span>
            </Link>

            {/* デスクトップナビゲーション */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant={pathname === item.href ? "default" : "ghost"}
                  className="rounded-full"
                  asChild
                >
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              ))}
            </div>

            {/* 右側のボタン */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />

              {/* モバイルメニューボタン */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 hover:scale-105"
                onClick={() => setIsOpen(!isOpen)}
              >
                <div className="relative w-5 h-5">
                  <Menu
                    className={`w-5 h-5 absolute transition-all duration-300 ${
                      isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                    }`}
                  />
                  <X
                    className={`w-5 h-5 absolute transition-all duration-300 ${
                      isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                    }`}
                  />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* フルスクリーンモバイルメニュー */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* 背景オーバーレイ */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-lg" onClick={() => setIsOpen(false)} />

        {/* メニューコンテンツ */}
        <div className="relative flex flex-col items-center justify-center h-full px-8">

          {/* ナビゲーションリンク */}
          <div className="flex flex-col items-center space-y-6">
            {navigation.map((item, index) => (
              <div
                key={item.name}
                className={`transition-all duration-500 ${
                  isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="lg"
                  className="text-2xl py-6 px-8 rounded-full min-w-[200px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 hover:scale-105"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
