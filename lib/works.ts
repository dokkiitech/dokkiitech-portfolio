export interface Work {
  title: string
  category: string
  summary: string
  stack: string[]
  image: string
  imageAlt: string
  href?: string
  linkLabel?: string
}

/** トップ・実績ページに常に表示する主な実績（Zenn の product 記事とは別に手で管理） */
export const featuredWorks: Work[] = [
  {
    title: "ヨリオダ（カフェ向けモバイルオーダー）",
    category: "自社プロダクト",
    summary:
      "個人経営のカフェ向けに、店舗の固定QRから会員登録なしで注文できるモバイルオーダーを開発中。客側の注文画面・キッチン画面・呼び出しモニター・店舗管理画面までを一貫して設計しています。",
    stack: ["AWS Serverless", "DynamoDB", "デジタル庁デザインシステム"],
    image: "/images/site/work-yorioda.webp",
    imageAlt: "ヨリオダのデモ画面。注文フローの説明とスマートフォンの注文画面",
    href: "https://demo.yorioder.app/",
    linkLabel: "デモを見る",
  },
  {
    title: "オンライン予約・打ち合わせ管理システム",
    category: "業務システム",
    summary:
      "当サイトの予約機能。空き枠をGoogleカレンダーから自動算出し、予約確定でMeet URLの発行・確認メール送信・チャット通知までを自動化。予約者専用の変更ページと管理画面も備えています。",
    stack: ["Next.js", "Google Calendar API", "Amazon SES", "DynamoDB"],
    image: "/images/site/work-booking.webp",
    imageAlt: "打ち合わせ予約画面。オンラインか対面かを選ぶステップ",
    href: "/appointment",
    linkLabel: "予約画面を見る",
  },
]
