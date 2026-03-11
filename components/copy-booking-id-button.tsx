"use client"

import type { MouseEvent } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface CopyBookingIdButtonProps {
  bookingId: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function CopyBookingIdButton({
  bookingId,
  className,
  variant = "outline",
  size = "sm",
}: CopyBookingIdButtonProps) {
  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    try {
      if (!navigator?.clipboard) {
        throw new Error("Clipboard API unavailable")
      }

      await navigator.clipboard.writeText(bookingId)
      toast({
        title: "予約番号をコピーしました",
        description: `予約番号 ${bookingId} をクリップボードにコピーしました。`,
      })
    } catch {
      toast({
        title: "コピーに失敗しました",
        description: "お手数ですが、予約番号を手動でコピーしてください。",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
      aria-label={`予約番号 ${bookingId} をコピー`}
      title="予約番号をコピー"
    >
      <Copy />
      {size === "icon" ? <span className="sr-only">コピー</span> : "コピー"}
    </Button>
  )
}
