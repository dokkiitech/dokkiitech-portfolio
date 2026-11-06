import Link from "next/link"

export function ContactBand() {
  return (
    <section className="bg-brand text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-8 md:py-16">
        <div>
          <h2 className="text-2xl font-bold leading-[1.4] md:text-3xl">まずはお気軽にご相談ください</h2>
          <p className="mt-3 leading-[1.9] text-white/90">
            ご相談・お見積りは無料です。内容が固まっていなくても大丈夫です。
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link href="/appointment" className="btn-inverse">
            相談日時を予約する
          </Link>
          <a
            href="mailto:info@dokkiitech.com"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white px-6 py-3 font-bold text-white hover:bg-white/10 hover:underline hover:underline-offset-4"
          >
            メールで問い合わせる
          </a>
        </div>
      </div>
    </section>
  )
}
