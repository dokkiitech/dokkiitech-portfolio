"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from "lucide-react"
import Link from "next/link"
import type { ZennArticle } from "@/lib/zenn"

interface BlogSectionProps {
  blogs: ZennArticle[]
}

export function BlogSection({ blogs }: BlogSectionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('BlogSection mounted with blogs:', blogs.length)
  }, [])

  if (!mounted) return null

  return (
    <section
      className="snap-section flex items-center justify-center bg-muted/30 py-20"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Latest Blog Posts
          </h2>
          <p className="text-xl text-muted-foreground">技術ブログの最新記事</p>
        </div>

        {blogs.length > 0 ? (
          <>
            <div className="max-w-4xl mx-auto space-y-6 mb-12">
              {blogs.map((blog, index) => {
                const delay = index * 0.1

                return (
                  <a
                    key={blog.link}
                    href={blog.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-6 rounded-2xl border-2 bg-card hover:bg-accent transition-all duration-500 opacity-100 translate-x-0 animate-fade-in"
                    style={{
                      animationDelay: `${delay}s`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {new Date(blog.pubDate).toLocaleDateString('ja-JP')}
                        </p>
                        {blog.contentSnippet && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {blog.contentSnippet}
                          </p>
                        )}
                        {blog.categories && blog.categories.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {blog.categories.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-2 group-hover:text-primary transition-all flex-shrink-0" />
                    </div>
                  </a>
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
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">ブログ記事が見つかりませんでした</p>
          </div>
        )}
      </div>
    </section>
  )
}
