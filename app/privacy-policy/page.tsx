import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "プライバシーポリシー | DOKKIITECH",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen">
      <PageHeader path="/privacy-policy" title="プライバシーポリシー" description="最終更新日: 2025年10月9日" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <article className="max-w-3xl space-y-8 leading-8 text-foreground/90 [&_h2]:border-l-2 [&_h2]:border-primary [&_h2]:pl-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground">
          <div className="space-y-2">
            <h2>はじめに</h2>
            <p>
              dokkiitech（以下「当方」といいます）は、当方が提供するアプリケーション（以下「本アプリ」といいます）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
            </p>
          </div>
          <div className="space-y-2">
            <h2>収集する情報</h2>
            <p>
              本アプリでは、サービスの提供、改善、およびユーザーサポートのために、以下の情報を収集することがあります。
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>端末情報（OSバージョン、デバイスモデルなど）</li>
              <li>利用状況（機能の利用頻度、クラッシュレポートなど）</li>
              <li>ユーザーから提供される情報（お問い合わせ時のメールアドレスなど）</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h2>情報の利用目的</h2>
            <p>
              収集した情報は、以下の目的で利用します。
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>本アプリのサービス提供および運営のため</li>
              <li>ユーザーからのお問い合わせに対応するため</li>
              <li>本アプリの品質向上および新機能開発のため</li>
              <li>利用規約に違反したユーザーの特定や、その他不正不当な目的でサービスを利用したユーザーの特定をし、ご利用をお断りするため</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h2>情報の第三者提供</h2>
            <p>
              当方は、法令で認められる場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
            </p>
          </div>
          <div className="space-y-2">
            <h2>セキュリティ</h2>
            <p>
              当方は、収集した情報の紛失、盗用、悪用、不正アクセス、開示、改ざん、および破壊を防ぐための合理的な措置を講じています。
            </p>
          </div>
          <div className="space-y-2">
            <h2>プライバシーポリシーの変更</h2>
            <p>
              当方は、必要に応じて本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本アプリ内または当方のウェブサイトに掲載したときから効力を生じるものとします。
            </p>
          </div>
          <div className="space-y-2">
            <h2>お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは、下記の連絡先までお願いいたします。
            </p>
            <p className="font-mono text-sm">
              dokkiitech
              <br />
              info@dokkiitech.com
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
