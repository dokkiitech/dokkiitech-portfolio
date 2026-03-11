import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { FirstVisitLoader } from "@/components/first-visit-loader"
import { CtrlCTerminalShortcut } from "@/components/ctrl-c-terminal-shortcut"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DOKKIITECH",
  description: "木戸亮輔(dokkiitech)のポートフォリオサイトです。ターミナルUIを採用した楽しいポートフォリオを皆様に提供しています。木戸亮輔について知れることはもちろん、お打ち合わせのご予約もこちらから行なっていただけます。",
  metadataBase: new URL("https://www.dokkiitech.com"),
  openGraph: {
    title: "DOKKIITECH",
    description: "木戸亮輔(dokkiitech)のポートフォリオサイトです。ターミナルUIを採用した楽しいポートフォリオを皆様に提供しています。木戸亮輔について知れることはもちろん、お打ち合わせのご予約もこちらから行なっていただけます。",
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
    title: "DOKKIITECH",
    description: "木戸亮輔(dokkiitech)のポートフォリオサイトです。ターミナルUIを採用した楽しいポートフォリオを皆様に提供しています。木戸亮輔について知れることはもちろん、お打ち合わせのご予約もこちらから行なっていただけます。",
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
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange storageKey="dokkiitech-theme">
          <FirstVisitLoader />
          <CtrlCTerminalShortcut />
          <Navigation />
          <div className="pt-16">{children}</div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
