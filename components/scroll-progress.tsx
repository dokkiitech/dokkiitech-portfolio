"use client"

import { useEffect, useState } from "react"

interface ScrollProgressProps {
  containerRef: React.RefObject<HTMLDivElement>
}

export function ScrollProgress({ containerRef }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateProgress = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight - container.clientHeight
      const scrollProgress = (scrollTop / scrollHeight) * 100

      setProgress(scrollProgress)
    }

    container.addEventListener('scroll', updateProgress)
    return () => container.removeEventListener('scroll', updateProgress)
  }, [containerRef])

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted/30 z-50">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
