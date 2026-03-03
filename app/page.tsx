import { HeroSection } from "@/components/hero-section"
import { LatestProducts } from "@/components/latest-products"
import { BlogCard } from "@/components/blog-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getZennArticles, getZennProductArticles } from "@/lib/zenn"
import {
  BookOpen,
  Calendar,
  Clock,
  Code,
  Coffee,
  Github,
  Instagram,
  Lightbulb,
  Mail,
  MessageCircle,
  Package,
  Rocket,
} from "lucide-react"
import { Suspense, lazy } from "react"
import { RiTwitterXFill } from "react-icons/ri"

const CodeAnimation = lazy(() => import("@/components/code-animation").then((m) => ({ default: m.CodeAnimation })))

function SectionSkeleton() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="animate-pulse">
        <div className="mx-auto mb-4 h-8 w-1/3 rounded bg-gray-300"></div>
        <div className="mx-auto mb-8 h-4 w-1/2 rounded bg-gray-300"></div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-gray-300"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const [articles, products] = await Promise.all([getZennArticles("dokkiitech"), getZennProductArticles("dokkiitech")])

  const skills = ["Next.js", "React", "TypeScript", "CloudFlare", "AWS", "Docker", "PostgreSQL", "Python", "Java", "GAS"]

  const experiences = [
    {
      title: "福岡デザイン&テクノロジー専門学校 ホワイトハッカー専攻",
      period: "202404 - 現在",
      description: "現在2年生ホワイトハッカーを育成するための専攻でセキュリティについての知識を勉強しています",
    },
    {
      title: "インターン先 S様",
      period: "20202507 - ",
      description: "中長期インターンにてサーバーサイド業務を中心に活動",
    },
    {
      title: "インターン先 W様",
      period: "20202507 - ",
      description: "中長期インターンに参加中",
    },
  ]

  const socialLinks = [
    {
      name: "GitHub",
      icon: Github,
      url: "https://github.com/dokkiitech",
      color: "hover:text-gray-900 dark:hover:text-gray-100",
    },
    {
      name: "X",
      icon: RiTwitterXFill,
      url: "https://x.com/dokkiitech",
      color: "hover:text-blue-500",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/dokkiitech",
      color: "hover:text-blue-600",
    },
    {
      name: "Mail",
      icon: Mail,
      url: "mailto:info@dokkiitech.com",
      color: "hover:text-indigo-500",
    },
  ]

  return (
    <main className="min-h-screen">
      <section id="home" className="scroll-mt-24">
        <HeroSection />
      </section>

      <Suspense fallback={<SectionSkeleton />}>
        <CodeAnimation />
      </Suspense>

      <section id="products" className="scroll-mt-24">
        <Suspense fallback={<SectionSkeleton />}>
          <LatestProducts />
        </Suspense>
      </section>

      <section id="about" className="container mx-auto max-w-4xl scroll-mt-24 px-4 py-16">
        <div className="mb-16 text-center">
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">About Me</h2>
          <p className="text-xl text-muted-foreground">システムエンジニアとしての詳細なプロフィール</p>
        </div>

        <div className="grid gap-8 md:gap-12">
          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">プロフィール</h3>
              </div>
              <div className="space-y-4 leading-relaxed text-muted-foreground">
                <p>当サイトをご覧いただきありがとうございます。福岡デザイン＆テクノロジー専門学校 ホワイトハッカー専攻2年の木戸亮輔です。</p>
                <p>学校ではセキュリティ分野の学習に力を入れており、普段の個人開発ではフロント開発をはじめバックインフラなどフルスタックで開発をしています。</p>
                <p>モダンな技術を使うのが大好きでハッカソンなど出場時は新しい技術を必ず取り入れるようにしています。</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">スキル</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="rounded-full px-4 py-2 text-sm font-medium transition-transform hover:scale-105">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">経験</h3>
              </div>
              <div className="space-y-6">
                {experiences.map((exp, index) => (
                  <div key={index} className="border-l-4 border-primary/20 pb-6 pl-6 last:pb-0">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <h4 className="text-lg font-semibold">{exp.title}</h4>
                      <Badge variant="outline" className="w-fit rounded-full">
                        {exp.period}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{exp.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500">
                  <Coffee className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">趣味</h3>
              </div>
              <div className="space-y-4 leading-relaxed text-muted-foreground">
                <p>休日にDJプレイをしています。DJ以外にも身体を動かしたり、開発したりするのが大好きです。</p>
                <p>実は剣道3段を持っています。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="blog" className="container mx-auto scroll-mt-24 px-4 py-16">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 text-4xl font-bold">ブログ</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">Zennで技術記事を投稿しています。プログラミング、開発ツール、技術トレンドなどについて書いています。</p>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.link} article={article} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">記事を読み込めませんでした。</p>
          </div>
        )}
      </section>

      <section id="all-products" className="container mx-auto scroll-mt-24 px-4 py-16">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 text-4xl font-bold">Products</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">これまで開発したプロダクトの一覧です。各プロダクトの詳細はZennで公開しています。</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((article) => (
              <BlogCard key={article.link} article={article} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">プロダクトを準備中です。</p>
          </div>
        )}
      </section>

      <section id="contact" className="container mx-auto max-w-4xl scroll-mt-24 px-4 py-16">
        <div className="mb-16 text-center">
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">Contact</h2>
          <p className="text-xl text-muted-foreground">お気軽にお声がけください</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">SNS</h3>
              </div>
              <div className="space-y-4">
                {socialLinks.map((link) => (
                  <Button key={link.name} variant="ghost" size="lg" className={`h-14 w-full justify-start rounded-2xl transition-colors ${link.color}`} asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <link.icon className="mr-4 h-6 w-6" />
                      <span className="text-lg">{link.name}</span>
                      <span className="ml-auto text-sm text-muted-foreground">@dokkiitech</span>
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">メッセージ</h3>
              </div>
              <div className="space-y-6">
                <p className="leading-relaxed text-muted-foreground">プロジェクトのご相談、技術的な質問、コラボレーションのお誘いなど、どんなことでもお気軽にご連絡ください。</p>
                <p className="leading-relaxed text-muted-foreground">お急ぎの場合は、各種SNSよりダイレクトメッセージをお送りいただけると 迅速にお返事いたします。</p>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">通常、24時間以内にお返事いたします。 お仕事のご依頼の場合は、詳細をお聞かせください。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="appoint" className="container mx-auto max-w-4xl scroll-mt-24 px-4 py-16">
        <div className="mb-16 text-center">
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">Appointment</h2>
          <p className="text-xl text-muted-foreground">お打ち合わせのご予約</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">予約システム</h3>
              </div>
              <div className="space-y-6">
                <p className="leading-relaxed text-muted-foreground">お打ち合わせのご予約はこちらからお願いします。お急ぎの場合は各種SNSよりご連絡ください。</p>
                <Button size="lg" className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-lg hover:from-blue-600 hover:to-purple-600" asChild>
                  <a
                    href="https://calendar.google.com/calendar/u/0/appointments/AcZssZ3whB7e22y-Jp_M3XR9B8drZ8rJji3IGLGfAsw="
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Calendar className="mr-3 h-6 w-6" />
                    予約する
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">詳細</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                    <div>
                      <h4 className="mb-1 font-semibold">対応時間</h4>
                      <p className="text-sm text-muted-foreground">平日 11:00 - 23:59</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                    <div>
                      <h4 className="mb-1 font-semibold">所要時間</h4>
                      <p className="text-sm text-muted-foreground">30分 - 60分程度</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                    <div>
                      <h4 className="mb-1 font-semibold">形式</h4>
                      <p className="text-sm text-muted-foreground">オンライン（Google Meet）</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">お急ぎの場合</span>
                  </div>
                  <p className="text-sm text-muted-foreground">各種SNSよりダイレクトメッセージでご連絡ください。 迅速に対応いたします。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
