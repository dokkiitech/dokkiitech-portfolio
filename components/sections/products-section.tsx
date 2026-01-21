"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ZennArticle } from "@/lib/zenn"

interface ProductsSectionProps {
  products: ZennArticle[]
}

export function ProductsSection({ products }: ProductsSectionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('ProductsSection mounted with products:', products.length)
  }, [])

  if (!mounted) return null

  const colors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-red-500"
  ]

  return (
    <section
      className="snap-section flex items-center justify-center overflow-hidden py-20"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Latest Products
          </h2>
          <p className="text-xl text-muted-foreground">最新のプロダクト</p>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
              {products.map((product, index) => {
                const delay = index * 0.2
                const color = colors[index % colors.length]

                return (
                  <a
                    key={product.link}
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card
                      className="relative overflow-hidden border-2 hover:shadow-xl hover:scale-105 h-full transition-all duration-300 animate-fade-in"
                      style={{
                        animationDelay: `${delay}s`
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`}></div>
                      {product.thumbnail && (
                        <div className="relative h-48 w-full overflow-hidden">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-xl line-clamp-2">{product.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-3">
                          {product.contentSnippet || ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(product.pubDate).toLocaleDateString('ja-JP')}
                          </span>
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
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
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">プロダクトが見つかりませんでした</p>
          </div>
        )}
      </div>
    </section>
  )
}
