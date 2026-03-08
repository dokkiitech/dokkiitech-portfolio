export const metadata = {
  title: "SNS | DOKKIITECH",
  description: "DOKKIITECH の各種SNSリンク一覧です。",
}

const links = [
  { name: "X", href: "https://x.com/dokkiitech", handle: "@dokkiitech" },
  { name: "Instagram", href: "https://instagram.com/dokkiitech", handle: "@dokkiitech" },
  { name: "Zenn", href: "https://zenn.dev/dokkiitech", handle: "@dokkiitech" },
  { name: "GitHub", href: "https://github.com/dokkiitech", handle: "@dokkiitech" },
  { name: "Email", href: "mailto:info@dokkiitech.com", handle: "info@dokkiitech.com" },
]

export default function SnsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-4xl px-4 py-24">
        <h1 className="text-3xl font-bold">SNS</h1>
        <p className="mt-2 text-slate-300">各リンクから `@dokkiitech` のアカウントへ移動できます。</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target={item.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
              className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-cyan-400/50 hover:bg-slate-800"
            >
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-sm text-slate-400">{item.handle}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
