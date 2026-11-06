import Link from "next/link"
import { ContactBand } from "@/components/contact-band"
import { PageHeader } from "@/components/page-header"
import { getFocusStackFromGitHub, type FocusStackItem } from "@/lib/github"

export const metadata = {
  title: "代表者紹介",
  description: "dokkiitech 代表 木戸亮輔のプロフィール・経歴・活動・使用技術です。",
}

const fallbackSkills: FocusStackItem[] = [
  { language: "TypeScript", percentage: 0 },
  { language: "Go", percentage: 0 },
  { language: "Next.js", percentage: 0 },
  { language: "AWS", percentage: 0 },
  { language: "Docker", percentage: 0 },
  { language: "Terraform", percentage: 0 },
]

const businessInfo = [
  { label: "屋号", value: "dokkiitech（ドッキーテック）" },
  { label: "代表", value: "木戸 亮輔" },
  { label: "開業", value: "2026年11月" },
  { label: "所在地", value: "福岡県北九州市小倉北区" },
  { label: "事業内容", value: "Webサイト・Webアプリ開発／クラウド・インフラ構築／業務改善・自動化／技術研修・コミュニティ運営" },
  { label: "連絡先", value: "info@dokkiitech.com" },
]

const activities = [
  { org: "一般社団法人TSUNAGU TechLinkLab", role: "開発責任者" },
  { org: "北九州発ITコミュニティ StepByCode", role: "運営・技術メンター" },
  { org: "Tech.C Venture（福岡デザイン＆テクノロジー専門学校公認 学生エンジニア団体）", role: "設立者・代表" },
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
    <main>
      <PageHeader
        eyebrow="About"
        title="代表者紹介"
        lead="バックエンドを主軸に、インフラ・フロントエンドまで一貫して担当します。"
        image="/images/site/service-training.webp"
      />

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-[280px_1fr] md:px-8 md:py-20">
        <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-10">
          {/* 代表者の写真に差し替える想定 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.svg" alt="" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600">dokkiitech 代表</p>
          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            木戸 亮輔<span className="ml-3 text-base font-normal text-gray-600">Ryosuke Kido</span>
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 leading-[1.9] text-gray-800">
            <p>
              福岡デザイン＆テクノロジー専門学校でセキュリティを専攻しながら、バックエンドを中心にWebサービスの開発・運用を行ってきました。
              自宅サーバー「dokkiitech Region」で自社プロダクトを運用し、AWS・Cloudflare を使ったインフラ構築や Terraform によるコード管理も日常的に手がけています。
            </p>
            <p>
              北九州・福岡のIT団体の運営や技術メンターとして、地域のIT文化を盛り上げる活動を続けてきました。
              その経験を活かし、地域の企業・お店のIT化を身近にお手伝いするため、2026年11月に個人事業 dokkiitech を開業しました。
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-8 md:py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">事業者情報</h2>
            <dl className="mt-6 divide-y divide-gray-200 border-y border-gray-200 bg-white">
              {businessInfo.map((row) => (
                <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[7rem_1fr]">
                  <dt className="text-sm font-bold text-gray-600">{row.label}</dt>
                  <dd className="text-gray-900">
                    {row.label === "連絡先" ? (
                      <a href={`mailto:${row.value}`} className="text-link">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">所属・活動</h2>
            <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200 bg-white">
              {activities.map((item) => (
                <li key={item.org} className="px-5 py-4">
                  <p className="font-bold text-gray-900">{item.org}</p>
                  <p className="text-sm text-gray-600">{item.role}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <h2 className="text-2xl font-bold text-gray-900">使用技術</h2>
        <p className="mt-2 text-gray-700">GitHub 上のコード量から集計した、最近よく使っている技術です。</p>
        <ul className="mt-8 grid gap-x-12 gap-y-5 md:grid-cols-2">
          {skills.map((item) => (
            <li key={item.language}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-gray-900">{item.language}</span>
                <span className="text-sm text-gray-600">{item.percentage > 0 ? `${item.percentage}%` : ""}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100" aria-hidden>
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${item.percentage > 0 ? Math.max(item.percentage, 6) : 100}%`, opacity: item.percentage > 0 ? 1 : 0.15 }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-gray-700">
          GitHub・Zenn・SNS へのリンクは <Link href="/contact" className="text-link">お問い合わせ</Link> ページにまとめています。
        </p>
      </section>

      <ContactBand />
    </main>
  )
}
