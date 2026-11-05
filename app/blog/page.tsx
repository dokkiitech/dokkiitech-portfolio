import { BlogCard } from "@/components/blog-card"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { getZennArticles } from "@/lib/zenn"
import { ArrowUpRight } from "lucide-react"

export const metadata = {
  title: "ブログ | DOKKIITECH",
  description: "木戸亮輔のZennブログ記事一覧です。技術記事やプログラミングに関する情報を発信しています。",
}

export default async function BlogPage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const articles = await getZennArticles(username)
  const zennUrl = `https://zenn.dev/${username}`

  return (
    <main className="min-h-screen">
      <PageHeader
        path="/blog"
        title="ブログ"
        description="Zennで技術記事を投稿しています。プログラミング、開発ツール、技術トレンドなどについて書いています。"
      >
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <a href={zennUrl} target="_blank" rel="noopener noreferrer">
            Zennプロフィールを見る
            <ArrowUpRight />
          </a>
        </Button>
        {articles.length > 0 && <span className="font-mono text-xs text-muted-foreground">{articles.length} articles</span>}
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.link} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState message="記事を読み込めませんでした。">
            <a href={zennUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline-offset-4 hover:underline">
              Zennで直接記事を読む →
            </a>
          </EmptyState>
        )}
      </div>
    </main>
  )
}

