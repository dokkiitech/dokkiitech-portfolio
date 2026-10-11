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

// 所属コミュニティ。ホームの whoami とプロフィールで共通
export const affiliations: { org: string; role?: string }[] = [
  { org: "JINEN株式会社", role: "STECHコミュニティマネージャー" },
  { org: "一般社団法人TSUNAGU TechLinkLab", role: "エンジニア" },
  { org: "STECH", role: "学生運営" },
  { org: "特定非営利活動法人Nxtend" },
  { org: "Tech.C Venture", role: "代表" },
  { org: "StepByCode", role: "運営" },
]
