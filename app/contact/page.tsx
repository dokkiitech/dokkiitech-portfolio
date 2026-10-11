import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { SectionLabel } from "@/components/section-label"
import { Button } from "@/components/ui/button"
import { isExternalHref, socialLinks } from "@/lib/site"
import { ArrowRight, ArrowUpRight, CalendarClock } from "lucide-react"

export const metadata = {
  title: "Contact | DOKKIITECH",
  description: "木戸亮輔（DOKKIITECH）への連絡先・SNS一覧です。",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <PageHeader path="/contact" title="Contact" description="お気軽にお声がけください。" />

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-5">
        <section aria-labelledby="sns-heading" className="lg:col-span-3">
          <SectionLabel>ls ~/sns</SectionLabel>
          <h2 id="sns-heading" className="mt-3 text-lg font-semibold">SNS</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {socialLinks.map(({ label, href, handle, icon: Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target={isExternalHref(href) ? "_blank" : undefined}
                  rel={isExternalHref(href) ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground transition-colors group-hover:border-primary/30 group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{label}</span>
                    <span className="block truncate font-mono text-xs text-muted-foreground">{handle}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-5 lg:col-span-2">
          <article className="rounded-2xl border border-border bg-card p-6">
            <SectionLabel>cat message.txt</SectionLabel>
            <h2 className="mt-3 text-lg font-semibold">メッセージ</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
              <p>プロジェクトのご相談、技術的な質問、コラボレーションのお誘いなど、どんなことでもお気軽にご連絡ください。</p>
              <p>お急ぎの場合は、各種SNSよりダイレクトメッセージをお送りいただけると迅速にお返事いたします。</p>
            </div>
            <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-xs leading-6 text-muted-foreground">
              通常、24時間以内にお返事いたします。お仕事のご依頼の場合は、詳細をお聞かせください。
            </p>
          </article>

          <article className="rounded-2xl border border-primary/30 bg-accent/60 p-6">
            <SectionLabel>book</SectionLabel>
            <h2 className="mt-3 text-lg font-semibold">直接話したい場合は</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Google Meet・対面でのお打ち合わせを予約できます。</p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/appointment">
                <CalendarClock />
                予約ページへ
                <ArrowRight />
              </Link>
            </Button>
          </article>
        </aside>
      </div>
    </main>
  )
}
