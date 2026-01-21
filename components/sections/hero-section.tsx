"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef, lazy, Suspense } from "react"
import { useWindowScrollInElement } from "use-window-scroll-in-element"

const TechBackground = lazy(() => import("../tech-background").then(m => ({ default: m.TechBackground })))

interface HeroSectionProps {
  containerRef: React.RefObject<HTMLDivElement>
}

export function HeroSection({ containerRef }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // スクロール位置を取得（0-1のfraction）
  const scrollData = useWindowScrollInElement(sectionRef as React.RefObject<HTMLElement>)
  const scrollFraction = scrollData?.fraction?.top ?? 0

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // パララックス効果の計算（fractionを0-100のパーセンテージに変換）
  const scrollProgress = scrollFraction * 100
  const parallaxY = scrollProgress * 0.5 // 50%の速度で移動
  const opacity = 1 - scrollFraction * 0.7 // スクロールで徐々に薄く
  const scale = 1 + scrollFraction * 0.2 // 徐々に拡大

  return (
    <section
      ref={sectionRef}
      className="snap-section flex items-center justify-center relative overflow-hidden"
    >
      {/* Background Animation */}
      <Suspense fallback={<div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10" />}>
        <TechBackground containerRef={sectionRef as React.RefObject<HTMLElement>} scrollProgress={scrollProgress} />
      </Suspense>
      <div className="absolute inset-0 -z-5 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>

      <div
        className="container mx-auto px-4 text-center relative z-10 parallax"
        style={{
          transform: `translateY(${parallaxY}px) scale(${scale})`,
          opacity: opacity
        }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* アイコン */}
          <div className="flex justify-center mb-8">
            <span
              className="text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              style={{
                transform: `scale(${1 + scrollProgress / 200})`,
                transition: 'transform 0.1s ease-out'
              }}
            >
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
              <Link href="/about">詳しく見る</Link>
            </Button>
          </div>

          {/* スクロールヒント */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            style={{ opacity: 1 - scrollProgress / 50 }}
          >
            <div className="flex flex-col items-center gap-2 animate-bounce">
              <span className="text-sm text-muted-foreground">Scroll Down</span>
              <svg
                className="w-6 h-6 text-muted-foreground"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
