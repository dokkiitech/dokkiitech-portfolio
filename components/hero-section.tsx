"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef, lazy, Suspense } from "react"

// TechBackgroundを遅延読み込み
const TechBackground = lazy(() => import("./tech-background").then(m => ({ default: m.TechBackground })))

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section ref={sectionRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Animation - 遅延読み込み */}
      <Suspense fallback={<div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10" />}>
        <TechBackground containerRef={sectionRef} />
      </Suspense>
      <div className="absolute inset-0 -z-5 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* アイコン */}
          <div className="flex justify-center mb-8">
            <span className="text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {"<>"}
            </span>
          </div>

          {/* メインタイトル */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in">
              DOKKIITECH
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Full Stack Developer
            </p>
          </div>

          {/* 自己紹介 */}
          {/* <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              モダンなWeb技術を活用したプロダクト開発に情熱を注ぐシステムエンジニアです。
              ユーザー体験を重視し、美しく機能的なアプリケーションの開発を得意としています。
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              新しい技術への探求心を持ち続け、常に学習と成長を続けています。
            </p>
          </div> */}

          {/* CTA ボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="/products">
                作品を見る
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 text-lg border-2 hover:bg-muted/50 transition-all duration-300"
              asChild
            >
              <Link href="/profile">詳しく見る</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
