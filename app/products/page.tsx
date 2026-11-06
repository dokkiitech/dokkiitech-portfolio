import { BlogCard } from "@/components/blog-card"
import { ContactBand } from "@/components/contact-band"
import { PageHeader } from "@/components/page-header"
import { WorkCard } from "@/components/work-card"
import { getZennProductArticles } from "@/lib/zenn"
import { featuredWorks } from "@/lib/works"

export const metadata = {
  title: "開発実績",
  description: "dokkiitech がこれまでに開発したプロダクト・システムの一覧です。",
}

export default async function ProductsPage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const articles = await getZennProductArticles(username)

  return (
    <main>
      <PageHeader
        eyebrow="Works"
        title="開発実績"
        lead="これまでに開発したプロダクトです。それぞれの技術構成や開発の経緯は Zenn の記事で紹介しています。"
        image="/images/site/service-web.webp"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <h2 className="text-2xl font-bold text-gray-900">主な実績</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {featuredWorks.map((work) => (
            <WorkCard key={work.title} work={work} />
          ))}
        </div>
        {articles.length > 0 && (
          <>
            <h2 className="mt-16 text-2xl font-bold text-gray-900">プロダクト紹介記事</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <BlogCard key={article.link} article={article} />
              ))}
            </div>
          </>
        )}
      </section>
      <ContactBand />
    </main>
  )
}
