"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useWindowScrollInElement } from "use-window-scroll-in-element"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// サンプル製品データ（後でZenn APIから取得可能）
const SAMPLE_PRODUCTS = [
  {
    id: 1,
    title: "Next.js Portfolio",
    description: "モダンなポートフォリオサイトのテンプレート",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    title: "React Dashboard",
    description: "管理画面のUIコンポーネント集",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "TypeScript Library",
    description: "便利なユーティリティライブラリ",
    color: "from-orange-500 to-red-500"
  }
]

export function ProductsSection() {
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const scrollData = useWindowScrollInElement(sectionRef as React.RefObject<HTMLElement>)
  const scrollFraction = scrollData?.fraction?.top ?? 0

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const scrollProgress = scrollFraction * 100

  // スクロール進捗に応じて表示するカードを計算
  const visibleCards = Math.min(
    Math.ceil(scrollFraction * SAMPLE_PRODUCTS.length * 1.5),
    SAMPLE_PRODUCTS.length
  )

  return (
    <section
      ref={sectionRef}
      className="snap-section flex items-center justify-center overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Latest Products
          </h2>
          <p className="text-xl text-muted-foreground">最新のプロダクト</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {SAMPLE_PRODUCTS.map((product, index) => {
            const isVisible = index < visibleCards
            const delay = index * 0.2

            return (
              <Card
                key={product.id}
                className={`relative overflow-hidden transition-all duration-700 border-2 hover:shadow-xl hover:scale-105 ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-20'
                }`}
                style={{
                  transitionDelay: `${delay}s`,
                  transform: isVisible
                    ? `perspective(1000px) rotateY(0deg)`
                    : `perspective(1000px) rotateY(-15deg)`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-10`}></div>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${product.color} mb-4 flex items-center justify-center`}>
                    <span className="text-2xl text-white font-bold">{product.id}</span>
                  </div>
                  <CardTitle className="text-2xl">{product.title}</CardTitle>
                  <CardDescription className="text-base">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full group" asChild>
                    <Link href="/products">
                      詳しく見る
                      <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
            asChild
          >
            <Link href="/products">
              すべてのプロダクトを見る
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
