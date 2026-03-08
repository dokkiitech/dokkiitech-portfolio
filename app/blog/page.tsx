import { BlogCard } from "@/components/blog-card"
import { getZennArticles } from "@/lib/zenn"
import { BookOpen } from "lucide-react"

export const metadata = {
  title: "ブログ | DOKKIITECH",
  description: "木戸亮輔のZennブログ記事一覧です。技術記事やプログラミングに関する情報を発信しています。",
}

export default async function BlogPage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const articles = await getZennArticles(username)

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* ヘッダーセクション */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">ブログ</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Zennで技術記事を投稿しています。プログラミング、開発ツール、技術トレンドなどについて書いています。
          </p>
          <a
            href={`https://zenn.dev/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-primary hover:underline"
          >
            Zennプロフィールを見る →
          </a>
        </div>

        {/* 記事一覧 */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <BlogCard key={article.link} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">記事を読み込めませんでした。</p>
            <a
              href={`https://zenn.dev/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Zennで直接記事を読む →
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
