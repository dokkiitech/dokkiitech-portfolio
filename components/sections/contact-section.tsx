"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Github, Twitter } from "lucide-react"
import { FaXTwitter } from "react-icons/fa6"
import Link from "next/link"
import { useWindowScrollInElement } from "use-window-scroll-in-element"

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    icon: Github,
    href: "https://github.com/dokkiitech",
    color: "from-gray-600 to-gray-800",
    hoverColor: "hover:from-gray-700 hover:to-gray-900"
  },
  {
    name: "X (Twitter)",
    icon: FaXTwitter,
    href: "https://twitter.com/dokkiitech",
    color: "from-blue-400 to-blue-600",
    hoverColor: "hover:from-blue-500 hover:to-blue-700"
  },
  {
    name: "Email",
    icon: Mail,
    href: "mailto:contact@dokkiitech.com",
    color: "from-purple-500 to-pink-500",
    hoverColor: "hover:from-purple-600 hover:to-pink-600"
  }
]

export function ContactSection() {
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
      className="snap-section flex items-center justify-center relative overflow-hidden"
    >
      {/* 背景のグラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 -z-10"></div>

      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div
            className={`transition-all duration-700 ${
              scrollProgress > 20
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12">
              お気軽にご連絡ください
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {SOCIAL_LINKS.map((social, index) => {
              const delay = index * 0.2
              const isVisible = scrollProgress > 30
              const Icon = social.icon

              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group p-8 rounded-3xl bg-card border-2 hover:border-primary transition-all duration-700 ${
                    isVisible
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-90'
                  }`}
                  style={{
                    transitionDelay: `${delay}s`
                  }}
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${social.color} ${social.hoverColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {social.name}
                  </h3>
                </a>
              )
            })}
          </div>

          <div
            className={`transition-all duration-700 delay-700 ${
              scrollProgress > 40
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="/contact">
                お問い合わせページへ
              </Link>
            </Button>
          </div>

          {/* フッター */}
          <div className="mt-20 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              © 2024 DOKKIITECH. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
