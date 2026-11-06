import { ExternalLink } from "lucide-react"
import type { ZennArticle } from "@/lib/zenn"

interface BlogCardProps {
  article: ZennArticle
  /** サムネイルが無い記事に表示する画像 */
  fallbackImage?: string
  headingLevel?: "h2" | "h3"
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(date)
}

export function BlogCard({ article, fallbackImage = "/images/site/service-web.webp", headingLevel = "h3" }: BlogCardProps) {
  const Heading = headingLevel
  const date = formatDate(article.pubDate)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-[0_2px_8px_1px_rgba(0,0,0,0.1),0_1px_5px_0_rgba(0,0,0,0.3)]">
      <div className="aspect-[1.91/1] w-full overflow-hidden bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.thumbnail || fallbackImage}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {date && (
          <time dateTime={article.pubDate} className="text-sm text-gray-600">
            {date}
          </time>
        )}
        <Heading className="text-lg font-bold leading-snug text-gray-900">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 group-hover:text-brand group-hover:underline group-hover:underline-offset-4"
          >
            <span className="line-clamp-2">{article.title}</span>
            <span className="sr-only">（Zennで開きます）</span>
          </a>
        </Heading>
        {article.description && <p className="line-clamp-3 text-sm leading-7 text-gray-700">{article.description}</p>}
        <p className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-brand">
          Zennで読む
          <ExternalLink className="h-4 w-4" aria-hidden />
        </p>
      </div>
    </article>
  )
}
