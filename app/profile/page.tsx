export const metadata = {
  title: "プロフィール | DOKKIITECH",
  description: "木戸亮輔（DOKKIITECH）のプロフィールページです。",
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-3xl px-4 py-24">
        <h1 className="text-3xl font-bold">プロフィール</h1>
        <p className="mt-4 leading-8 text-slate-300">
          木戸亮輔（DOKKIITECH）。Webアプリケーション開発とプロダクト企画を中心に活動しています。
          Zennでの技術発信、プロトタイピング、実運用までを一貫して担当します。
        </p>
      </section>
    </main>
  )
}
