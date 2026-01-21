"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { useWindowScrollInElement } from "use-window-scroll-in-element"

export function AboutSection() {
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const scrollData = useWindowScrollInElement(sectionRef as React.RefObject<HTMLElement>)
  const scrollFraction = scrollData?.fraction?.top ?? 0

  const codeLines = [
    "const developer = {",
    "  name: 'dokkiitech',",
    "  role: 'Student',",
    "  skills: ['Next.js', 'React', 'TypeScript', 'CloudFlare', 'AWS' ],",
    "  motto: 'Connecting the dots'",
    "};",
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // スクロール進捗に応じてハイライトする行を計算
  const scrollProgress = scrollFraction * 100
  const currentLine = Math.min(
    Math.floor(scrollFraction * codeLines.length * 1.5),
    codeLines.length - 1
  )

  return (
    <section ref={sectionRef} className="snap-section flex items-center justify-center bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profile
            </h2>
            <p className="text-muted-foreground">About Me</p>
          </div>

          <Card className="rounded-3xl border-2 bg-slate-900 dark:bg-slate-950 p-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-slate-400 text-sm">developer.ts</span>
            </div>

            <div className="font-mono text-sm md:text-base space-y-2">
              {codeLines.map((line, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index <= currentLine ? "text-green-400 opacity-100 translate-x-0" : "text-slate-600 opacity-50 translate-x-4"
                  }`}
                >
                  <span className="text-slate-500 mr-4">{(index + 1).toString().padStart(2, "0")}</span>
                  {line}
                  {index === currentLine && scrollProgress < 80 && (
                    <span className="animate-pulse text-green-400">|</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
