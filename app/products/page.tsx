import { BlogCard } from "@/components/blog-card"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { getZennProductArticles } from "@/lib/zenn"

export const metadata = {
  title: "Products | DOKKIITECH",
  description: "木戸亮輔が開発したプロダクト一覧です。",
}

export default async function ProductsPage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const articles = await getZennProductArticles(username)

  return (
    <main className="min-h-screen">
      <PageHeader
        path="/products"
        title="Products"
        description="これまで開発したプロダクトの一覧です。各プロダクトの詳細はZennで公開しています。"
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.link} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState message="プロダクトを準備中です。" />
        )}
      </div>
    </main>
  )
}
