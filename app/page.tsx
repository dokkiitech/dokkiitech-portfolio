import Link from "next/link"
import { ArrowRight, Cloud, Code2, GraduationCap, Workflow } from "lucide-react"
import { BlogCard } from "@/components/blog-card"
import { ContactBand } from "@/components/contact-band"
import { WorkCard } from "@/components/work-card"
import { featuredWorks } from "@/lib/works"
import { getZennArticles, getZennProductArticles } from "@/lib/zenn"

const services = [
  {
    icon: Code2,
    title: "Webサイト・Webアプリ開発",
    body: "会社・店舗のホームページから、予約・受付・管理画面などの業務システムまで。Next.js / TypeScript を中心に、スマホで見やすく更新しやすいものを作ります。",
    image: "/images/site/service-web.webp",
  },
  {
    icon: Cloud,
    title: "クラウド・インフラ構築",
    body: "AWS・Cloudflare を使ったサーバー構築、ドメイン・メール設定、監視まで。Terraform でコード化し、小さく始めて月額コストを抑える構成をご提案します。",
    image: "/images/site/service-infra.webp",
  },
  {
    icon: Workflow,
    title: "業務改善・自動化",
    body: "予約受付、カレンダー連携、メール・チャット通知、集計など、毎日の手作業を仕組みに置き換えます。既存のツールを活かした段階的な導入が得意です。",
    image: "/images/site/service-dx.webp",
  },
  {
    icon: GraduationCap,
    title: "技術研修・コミュニティ運営",
    body: "勉強会の講師・技術メンター、ハッカソンやIT団体の運営を行っています。学生・若手エンジニア向けの研修や社内勉強会の企画もご相談ください。",
    image: "/images/site/service-training.webp",
  },
]

const strengths = [
  {
    no: "01",
    title: "小さく始めて、育てる",
    body: "最初から大きく作り込まず、必要な機能から公開。使いながら改善するので、初期費用とリスクを抑えられます。",
  },
  {
    no: "02",
    title: "作って終わりにしない",
    body: "公開後の運用・監視・改修まで一人の担当者が見続けます。窓口がひとつなので、相談の行き違いがありません。",
  },
  {
    no: "03",
    title: "北九州・福岡で対面相談",
    body: "オンライン（Google Meet）に加えて、北九州市・福岡市周辺なら対面でのお打ち合わせも可能です。",
  },
]

const steps = [
  { title: "ご相談の予約", body: "予約ページから空いている日時を選んでください。オンライン・対面どちらでも構いません。" },
  { title: "ヒアリング・お見積り", body: "課題やご予算をうかがい、進め方と費用のご提案をお送りします。ご相談・お見積りは無料です。" },
  { title: "設計・開発", body: "画面イメージを確認しながら開発を進めます。途中経過は随時共有します。" },
  { title: "公開・運用サポート", body: "公開後の保守・改善も継続してお手伝いします。必要な分だけのご契約で大丈夫です。" },
]

export default async function HomePage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const [blogArticles, productArticles] = await Promise.all([
    getZennArticles(username),
    getZennProductArticles(username, 3),
  ])
  const latestPosts = blogArticles.slice(0, 3)

  return (
    <main>
      {/* ── ヒーロー ── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-dark">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
              北九州のIT事業者 dokkiitech
            </p>
            <h1 className="mt-5 text-[2rem] font-bold leading-[1.4] text-gray-900 md:text-[3.25rem] md:leading-[1.3]">
              Webとクラウドで、
              <br />
              地域のビジネスを
              <span className="text-brand">前へ。</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-[1.9] text-gray-700 md:text-lg">
              ホームページ制作から業務システム、AWSのインフラ構築まで。
              必要なところから小さく始めて、使いながら育てるIT支援を、企画から運用まで一人の担当者がお手伝いします。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/appointment" className="btn-primary">
                無料相談を予約する
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link href="#services" className="btn-secondary">
                事業内容を見る
              </Link>
            </div>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site/hero.webp"
              alt="ノートパソコンでコードを書いている作業デスク"
              width={1600}
              height={1067}
              className="aspect-[4/3] w-full rounded-lg object-cover"
              fetchPriority="high"
            />
            <div className="absolute -bottom-5 left-4 hidden rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-[0_2px_12px_2px_rgba(0,0,0,0.1),0_1px_6px_0_rgba(0,0,0,0.3)] sm:block">
              <p className="text-xs font-bold text-gray-600">ご相談・お見積り</p>
              <p className="text-xl font-bold text-gray-900">
                無料<span className="ml-1 text-sm font-normal text-gray-600">オンライン / 対面</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 事業内容 ── */}
      <section id="services" className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <p className="section-eyebrow">Services</p>
          <h2 className="section-title mt-2">事業内容</h2>
          <p className="section-lead">「何から頼めばいいか分からない」段階からご相談いただけます。</p>
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <li key={service.title} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.image} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand">
                      <service.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                  </div>
                  <p className="mt-4 leading-[1.9] text-gray-700">{service.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 選ばれる理由 ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <p className="section-eyebrow">Why dokkiitech</p>
          <h2 className="section-title mt-2">dokkiitech の進め方</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {strengths.map((item) => (
              <li key={item.no} className="border-t-4 border-black pt-6">
                <p className="font-mono text-3xl font-bold text-brand">{item.no}</p>
                <h3 className="mt-3 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-3 leading-[1.9] text-gray-700">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 自社プロダクト ── */}
      <section className="bg-black text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-100">Product</p>
            <h2 className="mt-2 text-[2rem] font-bold leading-[1.3] md:text-5xl">ヨリオダ</h2>
            <p className="mt-2 text-lg font-bold text-white md:text-xl">個人経営のカフェ向けモバイルオーダー</p>
            <p className="mt-5 leading-[1.9] text-gray-200">
              お店の固定QRコードから、会員登録なしで注文できるモバイルオーダーです。
              導入しやすい初期費用と低い月額費用で、行列や注文の聞き間違いを減らします。現在パイロット店舗を募集しながら開発中です。
            </p>
            <ul className="mt-6 space-y-2 text-gray-200">
              <li className="flex gap-2">
                <span className="text-brand-100" aria-hidden>■</span>QRを読むだけ、アプリ・会員登録は不要
              </li>
              <li className="flex gap-2">
                <span className="text-brand-100" aria-hidden>■</span>キッチン画面・呼び出しモニターも付属
              </li>
              <li className="flex gap-2">
                <span className="text-brand-100" aria-hidden>■</span>お支払いは今まで通りレジで
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="https://demo.yorioder.app/" target="_blank" rel="noopener noreferrer" className="btn-inverse">
                デモを触ってみる
                <span className="sr-only">（新しいタブで開きます）</span>
              </a>
              <Link href="/appointment" className="btn-primary">
                導入を相談する
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site/yorioda-cafe.webp"
              alt=""
              loading="lazy"
              className="aspect-[4/5] w-4/5 rounded-lg object-cover opacity-80"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site/yorioda-screen.webp"
              alt="ヨリオダの注文画面。カフェのメニューとカートボタンが表示されている"
              loading="lazy"
              className="absolute -bottom-6 right-0 w-1/2 rounded-[1.5rem] shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ── 実績 ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-eyebrow">Works</p>
              <h2 className="section-title mt-2">開発実績</h2>
            </div>
            <Link href="/products" className="text-link inline-flex items-center gap-1 font-bold">
              実績をすべて見る
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {featuredWorks.map((work) => (
              <WorkCard key={work.title} work={work} />
            ))}
          </div>
          {productArticles.length > 0 && (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {productArticles.map((article) => (
                <BlogCard key={article.link} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ご依頼の流れ ── */}
      <section className="bg-gray-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="section-eyebrow">Flow</p>
            <h2 className="section-title mt-2">ご依頼の流れ</h2>
            <p className="section-lead">まずは30分〜1時間ほど、お話をお聞かせください。</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site/consult.webp"
              alt="ノートパソコンを前に打ち合わせをしている様子"
              loading="lazy"
              className="mt-8 aspect-[3/2] w-full rounded-lg object-cover"
            />
          </div>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5 rounded-lg border border-gray-200 bg-white p-6">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black font-mono text-lg font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-2 leading-[1.9] text-gray-700">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 代表者 ── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[280px_1fr] md:px-8 md:py-24">
          <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-10">
            {/* 代表者の写真に差し替える想定。写真が用意できるまではロゴマークを表示 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-mark.svg" alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="section-eyebrow">About</p>
            <h2 className="section-title mt-2">代表 木戸 亮輔</h2>
            <p className="mt-5 max-w-3xl leading-[1.9] text-gray-700">
              バックエンドを主軸に、インフラ・フロントエンドまで一貫して手がけるエンジニアです。
              自宅サーバーでの自社サービス運用や、北九州・福岡のIT団体の運営・技術メンターとしての活動を経て、2026年11月に dokkiitech として開業しました。
            </p>
            <Link href="/profile" className="text-link mt-6 inline-flex items-center gap-1 font-bold">
              経歴・活動を見る
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ブログ ── */}
      {latestPosts.length > 0 && (
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="section-eyebrow">Blog</p>
                <h2 className="section-title mt-2">技術ブログ</h2>
              </div>
              <Link href="/blog" className="text-link inline-flex items-center gap-1 font-bold">
                記事一覧へ
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((article) => (
                <BlogCard key={article.link} article={article} fallbackImage="/images/site/service-dx.webp" />
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactBand />
    </main>
  )
}
