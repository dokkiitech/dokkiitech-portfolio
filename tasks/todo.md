# デザイン刷新: ターミナルを軸にしたデザインシステムへの統一

## 現状の課題（調査結果）

- **ブランド色がバラバラ**: ターミナル=emerald、UIモード=cyan、ナビ/Contact=blue→purple グラデ、primary=blue。サイトとして一貫した印象が無い
- **ライトモードで文字が読めない**: UIモードのタグ・予約ボタンが `text-cyan-100`、見出しラベルが `text-cyan-300`、リンクが `text-sky-300`、モード切替が `text-emerald-100` → 白背景でほぼ不可視
- **日本語フォント未指定**: Inter は和文グリフを持たずOS依存のフォールバック。等幅フォントも未指定
- **ページごとにヘッダーの作りが違う**: blog/products=中央寄せ+丸アイコン、contact=グラデ文字、profile=カード内見出し
- **a11y**: テーマ切替に aria-label 無し、ナビに aria-current 無し、モード切替が aria-pressed 無し
- **導線**: プライバシーポリシーへのリンクがどこにも無い（フッター無し）。非エンジニアがターミナルで何を打てばいいか分からない
- Contact の Mail 行に `@dokkiitech` と表示される（誤表記）

## 方針

ターミナルのアイデンティティ（emerald × 等幅）をサイト全体のデザイン言語にする。
「モノスペースのアイブロウ（`$ cd /blog`）＋ 和文サンセリフの本文」で統一。

## タスク

- [x] デザイントークン: primary/ring を emerald 系に、ダーク背景をニュートラルなほぼ黒に、フォント変数（Noto Sans JP + JetBrains Mono）
- [x] 共通 `PageHeader`（mono アイブロウ + h1 + 説明）を作り blog/products/profile/contact/privacy に適用
- [x] ナビ: ロゴを `~/dokkiitech` のターミナル風に、active 表示を下線/ドットに、aria-current、テーマ切替 aria-label、モバイルメニュー整理
- [x] ホーム（Terminal）: ウィンドウのタイトルバー化、モード切替をラベル付きセグメントに、クイックコマンドのチップ（タップで実行）、ブロックカーソル
- [x] ホーム（UI）: ライトモード不可視バグ修正、セクション見出し統一、SNS にアイコン、予約 CTA を Button に
- [x] BlogCard: 16:9 サムネ、lazy 読み込み、hover を枠色変化に（scale 廃止）、日付を mono
- [x] Profile: 所属団体をリスト化、スキルバーを primary 色に、SNS 行を整理
- [x] Contact: グラデ廃止、Mail 行の誤表記修正、予約への CTA
- [x] サイトフッター（ターミナル/予約画面以外）: リンク + プライバシーポリシー + ©
- [x] prefers-reduced-motion 対応、focus-visible

## 検証

- [x] `pnpm lint` / `pnpm build`
- [x] dev サーバーで全ページをライト/ダーク × デスクトップ/モバイル幅でスクショ確認
- [x] 予約ページ（primary 色変更の波及）が崩れていないこと
- [ ] Redmine: 12時以降にチケット起票・稼働記録・PR番号紐付け（EC2 停止時間帯のため後追い）

## レビュー（2026-10-12）

- 実装: 上記すべて対応。追加で、ASCII ロゴの崩れ対策（Web フォントのサブセットに罫線文字が無いため `.font-ascii` で OS 等幅に固定）、
  JSX 改行由来の和文中の半角スペース除去、ホームに sr-only の h1 を追加
- SNS/ナビ定義は `lib/site.ts` に集約（Contact で Zenn が抜けていた・Mail に @dokkiitech と出ていた問題を同時解消）
- 検証: `pnpm lint` エラー0（警告は既存のみ）/ `pnpm build` 成功 / ヘッドレス Chrome で全7ページ × 390px・1440px × light/dark を確認、
  横はみ出し0・コンソールエラー0 / ターミナルのチップ実行（book→cancel）とキーボード実行（ls）の動作確認
- 既存の `tsc` エラー（lib/zenn.ts 等、今回未変更）は `ignoreBuildErrors` で従来通り。今回の変更ファイルには型エラー無し

---

# AWS移管: Supabase→DynamoDB / Resend→SES（Redmine #112）

## 設計判断

- **DynamoDB**: テーブル `portfolio-booking-portal`、PK `id`(S)、GSI `booking_id-index`(PK `booking_id`)。
  一覧取得は件数が小さいので Scan + アプリ側ソート（date/time_slot/created_at desc）。PAY_PER_REQUEST。
- **SES**: ドメイン Identity `dokkiitech.dev` + Easy DKIM（DMARC adkim=s に整合）+ カスタム MAIL FROM `ses.dokkiitech.dev`。
  受信側（verify-mail の receipt rule set）には一切触れない。
- **認証**: アプリ用 IAM ユーザー `portfolio-app`（DynamoDB 対象テーブル CRUD + ses:SendEmail のみ）。
- **コード**: `lib/booking-portal.ts` の公開関数シグネチャは維持し、内部実装だけ差し替え。
  `sendResendMail` の重複2実装は `lib/mail.ts` に統合。

## タスク

### dokkiitech-infra
- [x] `aws/portfolio/` スタック作成（DynamoDB / SES identity + DKIM + MAIL FROM / IAM）
- [x] `cloudflare/dns/dokkiitech.dev.tf` に DKIM CNAME×3 + MAIL FROM MX/SPF 追加
- [x] terraform plan で差分確認 → apply（tools/tf-apply.sh 経由、6リソース追加）
- [x] ブランチ + PR 作成 → PR #37（DNS は CI apply なのでマージが本適用）

### dokkiitech-portfolio
- [x] `@aws-sdk/client-dynamodb` `@aws-sdk/lib-dynamodb` `@aws-sdk/client-sesv2` 追加
- [x] `lib/booking-portal.ts` を DynamoDB 実装に置換
- [x] `lib/mail.ts` 新設（SES送信、共通フッター込み）、route 2ファイルから利用
- [x] `lib/mtg-summary.ts` のステータス表記更新
- [x] `scripts/migrate-supabase-to-dynamodb.mjs` 追加
- [x] ビルド確認（pnpm build）
- [x] ブランチ + PR 作成

### 運用（要ユーザー協力 or 手動）
- [ ] SES 本番アクセス申請（サンドボックス解除。アカウントレベル操作のため権限で実行不可やった）
- [ ] データ移行実行（SUPABASE_URL / SERVICE_ROLE_KEY が必要）
- [ ] 稼働サーバー/Vercel の環境変数更新（AWSキー / BOOKING_TABLE_NAME / MAIL_FROM 追加、RESEND_*/SUPABASE_* 削除）
- [x] Redmine: PR番号紐付け → フィードバックへ

## レビュー（2026-08-25）

- インフラ: `aws/portfolio` apply 済み（DynamoDB / SES Identity / IAM、既存リソースへの変更ゼロ）。
  DNS（DKIM×3 + MAIL FROM MX/SPF）は infra PR #37 マージで CI apply される。
- アプリ: 実 DynamoDB に対して E2E 検証済み — 予約作成→レコード保存、token+password の verify、
  キャンセル（status=canceled + レコード返却）、admin 一覧（date フィルタ + expired 解決）全て OK。
  テストデータは削除済み（テーブル 0 件）。
- メール送信の実地検証は SES サンドボックス解除待ち（検証済みアドレス宛以外に送れないため）。
- レスポンス JSON のキー `resend` → `mail` に変更（フロントエンドに参照が無いことを確認済み）。
