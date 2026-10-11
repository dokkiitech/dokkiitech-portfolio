import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { SectionLabel } from "@/components/section-label"
import { getFocusStackFromGitHub } from "@/lib/github"
import { isExternalHref, socialLinks } from "@/lib/site"
import { ArrowUpRight, CalendarClock } from "lucide-react"

export const metadata = {
  title: "プロフィール | DOKKIITECH",
  description: "木戸亮輔（DOKKIITECH）のプロフィールページです。",
}

const fallbackSkills = [
  { language: "Next.js", percentage: 0 },
  { language: "TypeScript", percentage: 0 },
  { language: "Go", percentage: 0 },
  { language: "Docker", percentage: 0 },
  { language: "AWS", percentage: 0 },
  { language: "Security", percentage: 0 },
]

const details = [
  { term: "名前", value: "木戸亮輔" },
  { term: "卒年", value: "28卒" },
  { term: "所属校", value: "福岡デザイン＆テクノロジー専門学校" },
]

const affiliations = [
  { org: "一般社団法人TSUNAGU TechLinkLab", role: "開発責任者" },
  { org: "北九州発ITコミュニティ StepByCode", role: "運営 技術メンター" },
  { org: "福岡デザイン＆テクノロジー専門学校公認学生エンジニア団体 Tech.C Venture", role: "設立者・代表" },
  { org: "学生団体 STECH", role: "運営" },
]

export default async function ProfilePage() {
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "dokkiitech"
  let skills = fallbackSkills
  try {
    const fromGitHub = await getFocusStackFromGitHub(username)
    if (fromGitHub.length > 0) skills = fromGitHub
  } catch {
    skills = fallbackSkills
  }

  return (
    <main className="min-h-screen">
      <PageHeader path="/profile" title="木戸亮輔" description="28卒の学生エンジニア。主領域はバックエンド、インフラとフロントエンドもそこそこ。">
        <Button asChild size="sm" className="rounded-full">
          <Link href="/appointment">
            <CalendarClock />
            お打ち合わせを予約
          </Link>
        </Button>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-2">
          <SectionLabel>cat about.md</SectionLabel>
          <div className="mt-4 space-y-4 leading-8 text-muted-foreground">
            <p>
              初めまして或いはこんにちは。木戸です。28卒の学生エンジニアです。主領域はバックエンドです。その他にもインフラ周りやフロントエンドも適度にできる自称フロンエンドエンジニアです。
            </p>
            <p>
              様々なIT団体を運営し自身の技術力向上と共に地域のIT文化の活性化をするための活動をしています。また自宅サーバー dokkiitech Regionを運営し自身のプロダクトを幅広く更新しています。
            </p>
            <p>
              当サイトでは作ってきた作品の公開やブログ、私の使用技術の確認やお打ち合わせの予約ができます。気が向いた時にのんびり遊んでみてください。
            </p>
            <p>
              当サイトのTerminal UIに困惑された方もいらっしゃると思います。ごめんなさい。非エンジニアの方でも一応見れる設定になっていますのでよければもっと覗いてください。
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6">
          <SectionLabel>whoami --verbose</SectionLabel>
          <dl className="mt-4 divide-y divide-border">
            {details.map((item) => (
              <div key={item.term} className="grid grid-cols-[5rem_1fr] gap-3 py-3 text-sm">
                <dt className="font-mono text-xs leading-6 text-muted-foreground">{item.term}</dt>
                <dd className="leading-6">{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-2">
          <SectionLabel>ls ./affiliations</SectionLabel>
          <ol className="relative mt-5 space-y-5 border-l border-border pl-6">
            {affiliations.map((item) => (
              <li key={item.org} className="relative">
                <span aria-hidden className="absolute -left-[29px] top-2 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary ring-1 ring-primary/40" />
                <p className="font-medium leading-7">{item.org}</p>
                <p className="font-mono text-xs text-primary">{item.role}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6">
          <SectionLabel>open ./links</SectionLabel>
          <ul className="mt-4 space-y-1">
            {socialLinks.map(({ label, href, handle, icon: Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target={isExternalHref(href) ? "_blank" : undefined}
                  rel={isExternalHref(href) ? "noreferrer" : undefined}
                  className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="ml-auto truncate font-mono text-xs text-muted-foreground">{handle}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-3">
          <SectionLabel>git stats --languages</SectionLabel>
          <h2 className="mt-3 text-lg font-semibold">Focus Stack</h2>
          <p className="mt-1 text-sm text-muted-foreground">GitHub の公開リポジトリから集計した言語比率です。</p>
          <ul className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {skills.map((item) => (
              <li key={item.language}>
                <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs">
                  <span>{item.language}</span>
                  <span className="tabular-nums text-muted-foreground">{item.percentage > 0 ? `${item.percentage}%` : "-"}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(item.percentage, item.percentage > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  )
}
