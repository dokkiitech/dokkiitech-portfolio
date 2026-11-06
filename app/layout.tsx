import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
})

const siteTitle = "DOKKIITECH｜北九州のWeb開発・クラウド構築"
const siteDescription =
  "dokkiitech（ドッキーテック）は北九州市を拠点に、Webサイト・Webアプリ開発、AWSなどのクラウド構築、業務の自動化を小さく始めて育てるIT事業者です。オンライン・対面でのご相談を受け付けています。"

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: "%s｜DOKKIITECH",
  },
  description: siteDescription,
  metadataBase: new URL("https://www.dokkiitech.com"),
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://www.dokkiitech.com",
    siteName: "DOKKIITECH",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/ogp.PNG",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/ogp.PNG"],
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${notoSansJp.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange storageKey="dokkiitech-theme">
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2">
            本文へ移動
          </a>
          <Navigation />
          <div id="main" className="pt-16">{children}</div>
          <SiteFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
