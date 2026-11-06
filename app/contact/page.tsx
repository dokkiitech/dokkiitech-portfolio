import Link from "next/link"
import { CalendarDays, Github, Instagram, Mail, BookOpen } from "lucide-react"
import { RiTwitterXFill } from "react-icons/ri"
import { PageHeader } from "@/components/page-header"

export const metadata = {
  title: "お問い合わせ",
  description: "dokkiitech へのご相談・お問い合わせ窓口です。オンライン・対面でのご相談を予約できます。",
}

const socialLinks = [
  { name: "GitHub", icon: Github, url: "https://github.com/dokkiitech" },
  { name: "Zenn", icon: BookOpen, url: "https://zenn.dev/dokkiitech" },
  { name: "X", icon: RiTwitterXFill, url: "https://x.com/dokkiitech" },
  { name: "Instagram", icon: Instagram, url: "https://instagram.com/dokkiitech" },
]

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Contact"
        title="お問い合わせ"
        lead="お仕事のご依頼・ご相談はこちらから。ご相談・お見積りは無料です。内容が固まっていなくてもお気軽にどうぞ。"
        image="/images/site/consult.webp"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-lg border-2 border-brand bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-white">
                <CalendarDays className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-brand">おすすめ</p>
                <h2 className="text-xl font-bold text-gray-900">相談日時を予約する</h2>
              </div>
            </div>
            <p className="mt-5 leading-[1.9] text-gray-700">
              空いている日時を選ぶだけで予約が完了します。Google Meet でのオンライン相談、または北九州・福岡周辺での対面相談を選べます。
            </p>
            <Link href="/appointment" className="btn-primary mt-auto self-start">
              予約ページへ進む
            </Link>
          </div>

          <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                <Mail className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="text-xl font-bold text-gray-900">メールで問い合わせる</h2>
            </div>
            <p className="mt-5 leading-[1.9] text-gray-700">
              ご依頼内容・ご予算・希望時期などをお書き添えください。通常2営業日以内にご返信します。
            </p>
            <a href="mailto:info@dokkiitech.com" className="btn-secondary mt-auto self-start">
              info@dokkiitech.com
            </a>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">SNS・技術発信</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {socialLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-3 font-bold text-gray-900 hover:border-brand hover:text-brand hover:underline hover:underline-offset-4"
                >
                  <link.icon className="h-5 w-5" aria-hidden />
                  {link.name}
                  <span className="ml-auto text-sm font-normal text-gray-600">@dokkiitech</span>
                  <span className="sr-only">（新しいタブで開きます）</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
