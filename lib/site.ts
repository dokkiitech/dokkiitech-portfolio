import { Mail } from "lucide-react"
import type { ComponentType } from "react"
import { SiGithub, SiInstagram, SiX, SiZenn } from "react-icons/si"

export interface SocialLink {
  label: string
  href: string
  handle: string
  icon: ComponentType<{ className?: string }>
}

// SNS リンクはホーム/プロフィール/Contact/フッターで共通。ここだけ直せば全体に反映される
export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/dokkiitech", handle: "@dokkiitech", icon: SiGithub },
  { label: "X", href: "https://x.com/dokkiitech", handle: "@dokkiitech", icon: SiX },
  { label: "Zenn", href: "https://zenn.dev/dokkiitech", handle: "@dokkiitech", icon: SiZenn },
  { label: "Instagram", href: "https://instagram.com/dokkiitech", handle: "@dokkiitech", icon: SiInstagram },
  { label: "Email", href: "mailto:info@dokkiitech.com", handle: "info@dokkiitech.com", icon: Mail },
]

export const navigationItems = [
  { name: "ホーム", href: "/" },
  { name: "プロフィール", href: "/profile" },
  { name: "ブログ", href: "/blog" },
  { name: "Product", href: "/products" },
  { name: "SNS", href: "/contact" },
  { name: "お打ち合わせの予約", href: "/appointment" },
]

export const isExternalHref = (href: string) => !href.startsWith("mailto:")
