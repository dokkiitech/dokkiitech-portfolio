import { BlogCard } from "@/components/blog-card"
import { getZennProductArticles } from "@/lib/zenn"
import { Package } from "lucide-react"

export const metadata = {
  title: "Products | DOKKIITECH",
  description: "木戸亮輔が開発したプロダクト一覧です。",
}

export default async function ProductsPage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const articles = await getZennProductArticles(username)

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* ヘッダーセクション */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Products</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            これまで開発したプロダクトの一覧です。各プロダクトの詳細はZennで公開しています。
          </p>
        </div>

        {/* プロダクト一覧 */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <BlogCard key={article.link} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">プロダクトを準備中です。</p>
          </div>
        )}
      </div>
    </main>
  )
}
