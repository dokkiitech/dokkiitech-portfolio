export const metadata = {
  title: "プロフィール | DOKKIITECH",
  description: "木戸亮輔（DOKKIITECH）のプロフィールページです。",
}

const skills = ["Next.js", "TypeScript", "Go", "Docker", "AWS", "Tailwind CSS", "Security"]

const socials = [
  { name: "GitHub", href: "https://github.com/dokkiitech", id: "@dokkiitech" },
  { name: "X", href: "https://x.com/dokkiitech", id: "@dokkiitech" },
  { name: "Zenn", href: "https://zenn.dev/dokkiitech", id: "@dokkiitech" },
  { name: "Instagram", href: "https://instagram.com/dokkiitech", id: "@dokkiitech" },
]

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_55%,_#000_100%)] text-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="rounded-3xl border border-cyan-400/30 bg-slate-900/70 p-8 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur">
          <p className="text-xs tracking-[0.25em] text-cyan-300">PROFILE / DOKKIITECH</p>
          <h1 className="mt-3 text-4xl font-bold">木戸亮輔</h1>
          <p className="mt-6 leading-8 text-slate-300">
            セキュリティ領域の学習をベースに、Webアプリケーション開発とプロダクト制作を行っています。公開情報では
            福岡デザイン＆テクノロジー専門学校（ホワイトハッカー専攻）での学習や、サーバーサイド実務インターンの経験があり、
            現在は個人開発・技術発信・改善検証を並行して進めています。
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Focus Stack</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((item) => (
                <span key={item} className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">SNS / Links</h2>
            <ul className="mt-4 space-y-2 text-slate-300">
              {socials.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800">
                    <span>{item.name}</span>
                    <span className="text-xs text-slate-400">{item.id}</span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  )
}
