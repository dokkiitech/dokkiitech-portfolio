import { BlogCard } from "@/components/blog-card"
import { PageHeader } from "@/components/page-header"
import { getZennArticles } from "@/lib/zenn"

export const metadata = {
  title: "技術ブログ",
  description: "dokkiitech 代表 木戸亮輔が Zenn で公開している技術記事の一覧です。",
}

export default async function BlogPage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const articles = await getZennArticles(username)

  return (
    <main>
      <PageHeader
        eyebrow="Blog"
        title="技術ブログ"
        lead="開発や運用で得た知見を Zenn で発信しています。"
        image="/images/site/service-dx.webp"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        {articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.link} article={article} headingLevel="h2" fallbackImage="/images/site/service-dx.webp" />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-700">記事を読み込めませんでした。</p>
        )}
        <p className="mt-10 text-center">
          <a href={`https://zenn.dev/${username}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Zenn のプロフィールを見る
            <span className="sr-only">（新しいタブで開きます）</span>
          </a>
        </p>
      </section>
    </main>
  )
}
