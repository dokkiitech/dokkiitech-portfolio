"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || el.isContentEditable
}

export function CtrlCTerminalShortcut() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCtrlC = event.ctrlKey && event.key.toLowerCase() === "c"
      if (!isCtrlC) return
      if (pathname === "/") return
      if (isTypingTarget(event.target)) return

      event.preventDefault()
      router.push("/")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [pathname, router])

  return null
}
