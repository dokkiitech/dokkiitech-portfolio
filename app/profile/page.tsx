import { getFocusStackFromGitHub } from "@/lib/github"

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

const socials = [
  { name: "GitHub", href: "https://github.com/dokkiitech", id: "@dokkiitech" },
  { name: "X", href: "https://x.com/dokkiitech", id: "@dokkiitech" },
  { name: "Zenn", href: "https://zenn.dev/dokkiitech", id: "@dokkiitech" },
  { name: "Instagram", href: "https://instagram.com/dokkiitech", id: "@dokkiitech" },
  { name: "Email", href: "mailto:info@dokkiitech.com", id: "info@dokkiitech.com" },
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
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <p className="text-xs tracking-[0.25em] text-cyan-300">PROFILE / DOKKIITECH</p>
          <h1 className="mt-3 text-4xl font-bold">木戸亮輔</h1>
          <p className="mt-6 leading-8 text-muted-foreground">
            初めまして或いはこんにちは。木戸です。28卒の学生エンジニアです。主領域はバックエンドです。その他にもインフラ周りやフロントエンドも適度にできる自称フロンエンドエンジニアです。
            様々なIT団体を運営し自身の技術力向上と共に地域のIT文化の活性化をするための活動をしています。また自宅サーバー dokkiitech Regionを運営し自身のプロダクトを幅広く更新しています。
            当サイトでは作ってきた作品の公開やブログ、私の使用技術の確認やお打ち合わせの予約ができます。気が向いた時にのんびり遊んでみてください。
            当サイトのTerminal UIに困惑された方もいらっしゃると思います。ごめんなさい。非エンジニアの方でも一応見れる設定になっていますのでよければもっと覗いてください。
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Focus Stack</h2>
            <div className="mt-4 space-y-3">
              {skills.map((item) => (
                <div key={item.language}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.language}</span>
                    <span className="text-muted-foreground">{item.percentage > 0 ? `${item.percentage}%` : "-"}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.max(item.percentage, item.percentage > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">SNS / Links</h2>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              {socials.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted">
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.id}</span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <article className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">プロフィール詳細</h2>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>名前：木戸亮輔</p>
            <p>卒年：28卒</p>
            <p>所属校：福岡デザイン＆テクノロジー専門学校</p>
            <p>所属団体一覧：</p>
            <p>一般社団法人TSUNAGU TechLinkLab 開発責任者</p>
            <p>北九州発ITコミュニティ StepByCode 運営 技術メンター</p>
            <p>福岡デザイン＆テクノロジー専門学校公認学生エンジニア団体 Tech.C Venture 設立者・代表</p>
            <p>学生団体 STECH 運営</p>
          </div>
        </article>
      </section>
    </main>
  )
}
