import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Work } from "@/lib/works"

export function WorkCard({ work, headingLevel = "h3" }: { work: Work; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel
  const external = work.href?.startsWith("http")
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="aspect-[16/9] overflow-hidden border-b border-gray-200 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={work.image} alt={work.imageAlt} loading="lazy" className="h-full w-full object-cover object-top" />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <p className="text-sm font-bold text-brand">{work.category}</p>
        <Heading className="mt-1 text-xl font-bold leading-snug text-gray-900">{work.title}</Heading>
        <p className="mt-3 leading-[1.9] text-gray-700">{work.summary}</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="使用技術">
          {work.stack.map((tech) => (
            <li key={tech} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-800">
              {tech}
            </li>
          ))}
        </ul>
        {work.href && (
          <div className="mt-auto pt-6">
            {external ? (
              <a href={work.href} target="_blank" rel="noopener noreferrer" className="text-link inline-flex items-center gap-1 font-bold">
                {work.linkLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
                <span className="sr-only">（新しいタブで開きます）</span>
              </a>
            ) : (
              <Link href={work.href} className="text-link inline-flex items-center gap-1 font-bold">
                {work.linkLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
