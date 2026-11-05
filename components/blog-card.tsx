import { ArrowUpRight } from "lucide-react"
import type { ZennArticle } from "@/lib/zenn"

interface BlogCardProps {
  article: ZennArticle
}

export function BlogCard({ article }: BlogCardProps) {
  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  const published = new Date(article.pubDate)
  const isoDate = Number.isNaN(published.getTime()) ? undefined : published.toISOString()

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_hsl(var(--primary)/0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {article.thumbnail && (
        <div className="aspect-[1.91/1] w-full overflow-hidden border-b border-border bg-muted">
          <img
            src={article.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-base font-semibold leading-7 transition-colors group-hover:text-primary">{article.title}</h2>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        {article.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.description}</p>
        )}
        <p className="mt-auto pt-4 font-mono text-xs text-muted-foreground">
          <time dateTime={isoDate}>{formatDate(article.pubDate)}</time>
        </p>
      </div>
    </a>
  )
}
