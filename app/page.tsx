import Link from "next/link"
import { ArrowRight, Mail, Rocket, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeAnimation } from "@/components/code-animation"

export default function HomePage() {
  const highlights = [
    {
      icon: Rocket,
      title: "Ship Quickly",
      description: "Rapidly prototype and launch web products with a practical engineering approach.",
    },
    {
      icon: Layers,
      title: "Build Solid Foundations",
      description: "Maintainable architecture, reusable components, and scalable front-end patterns.",
    },
    {
      icon: Mail,
      title: "Collaborate Clearly",
      description: "Fast communication and transparent progress from kickoff to delivery.",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-sky-50/30 to-background dark:via-slate-900/30">
      <section className="container mx-auto max-w-5xl px-4 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex rounded-full border border-sky-300/40 bg-sky-100/60 px-4 py-1 text-sm font-medium text-sky-800 dark:border-sky-700/40 dark:bg-sky-900/30 dark:text-sky-200">
            ポートフォリオ
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            速く、丁寧に、使いやすい
            <br />
            Webプロダクトを作ります
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            設計から実装まで一貫して、保守しやすく拡張可能なプロダクト開発を行っています。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/projects">
                Projectsを見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/contact">お問い合わせ</Link>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/blog">Blog</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/appoint">予約ページ</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-16">
        <CodeAnimation />
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="rounded-2xl border shadow-sm">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                    <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">
                  {item.title === "Ship Quickly"
                    ? "高速開発"
                    : item.title === "Build Solid Foundations"
                      ? "堅実な設計"
                      : "円滑な連携"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {item.title === "Ship Quickly"
                    ? "検証からリリースまでを短いサイクルで進め、価値提供を加速します。"
                    : item.title === "Build Solid Foundations"
                      ? "再利用性・可読性・拡張性を重視した実装で長期運用に耐える土台を作ります。"
                      : "進捗と判断を明確に共有し、認識ズレの少ない開発を実現します。"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
