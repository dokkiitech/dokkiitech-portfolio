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
