import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Projects | DOKKIITECH",
  description: "制作実績とプロダクト開発の紹介ページです。",
}

const projects = [
  {
    title: "Portfolio Redesign",
    summary: "情報設計を見直し、見やすさと導線を重視して再構成したポートフォリオです。",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    href: "/",
    cta: "サイトを見る",
  },
  {
    title: "Zenn連携コンテンツ",
    summary: "外部記事フィードを活用し、情報を整理して表示するコンテンツ連携の実装です。",
    tags: ["SSR", "Content Integration", "Performance"],
    href: "/products",
    cta: "ページを見る",
  },
  {
    title: "Contact導線設計",
    summary: "相談・依頼・連絡がしやすいように設計したシンプルな問い合わせ導線です。",
    tags: ["UX", "Accessibility", "Responsive UI"],
    href: "/contact",
    cta: "お問い合わせ",
  },
]

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-cyan-50/30 to-background px-4 pb-20 pt-20 dark:via-slate-900/20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Projects</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            プロダクト思考と実装品質を重視して進めた制作・開発実績を掲載しています。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.title} className="flex h-full flex-col rounded-2xl border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-muted-foreground">{project.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link href={project.href}>
                    {project.cta}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
