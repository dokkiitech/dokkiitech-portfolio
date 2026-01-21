"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from "lucide-react"
import Link from "next/link"
import { useWindowScrollInElement } from "use-window-scroll-in-element"

const SAMPLE_BLOGS = [
  {
    id: 1,
    title: "Next.js 15の新機能を試してみた",
    date: "2024-01-15",
    tags: ["Next.js", "React"]
  },
  {
    id: 2,
    title: "TypeScriptで型安全なAPIクライアントを作る",
    date: "2024-01-10",
    tags: ["TypeScript", "API"]
  },
  {
    id: 3,
    title: "Tailwind CSSのベストプラクティス",
    date: "2024-01-05",
    tags: ["CSS", "Tailwind"]
  }
]

export function BlogSection() {
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const scrollData = useWindowScrollInElement(sectionRef as React.RefObject<HTMLElement>)
  const scrollFraction = scrollData?.fraction?.top ?? 0

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const scrollProgress = scrollFraction * 100

  return (
    <section
      ref={sectionRef}
      className="snap-section flex items-center justify-center bg-muted/30"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Latest Blog Posts
          </h2>
          <p className="text-xl text-muted-foreground">技術ブログの最新記事</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 mb-12">
          {SAMPLE_BLOGS.map((blog, index) => {
            const delay = index * 0.15
            const isVisible = scrollProgress > 20

            return (
              <div
                key={blog.id}
                className={`group p-6 rounded-2xl border-2 bg-card hover:bg-accent transition-all duration-500 cursor-pointer ${
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-20'
                }`}
                style={{
                  transitionDelay: `${delay}s`
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{blog.date}</p>
                    <div className="flex gap-2 flex-wrap">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-2 group-hover:text-primary transition-all" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 py-6 text-lg border-2 hover:bg-muted/50 transition-all duration-300"
            asChild
          >
            <Link href="/blog">
              すべての記事を見る
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
