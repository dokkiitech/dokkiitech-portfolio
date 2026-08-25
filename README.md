# DOKKIITECH Portfolio

Next.js (App Router) で構築したポートフォリオサイトです。  
トップページで `Terminal Mode / UI Mode` を切り替え、プロフィール・ブログ・Product・SNS を閲覧できます。

## 実装ポイント

- ヘッダートグル: `Terminal Mode / UI Mode`
- 日本語UI
- ブログ連携: Zenn 投稿一覧
- Product連携: Zenn の `product` タグ記事のみ表示
- 予約ページ: `meet / 対面` 選択、対面時は場所必須バリデーション
- 予約 API: Google Calendar / Meet / Amazon SES 対応（`mock` モードあり）
- レスポンシブ対応（mobile / tablet / desktop）

## セットアップ

```bash
pnpm install
pnpm dev
```

## 環境変数

`.env.local` の例:

```bash
NEXT_PUBLIC_ZENN_USERNAME=dokkiitech
NEXT_PUBLIC_GITHUB_USERNAME=dokkiitech
GH_TOKEN=
# GH_TOKEN は GitHub API 認証用（public_repo 読み取りで可）
# private含める場合は Fine-grained PAT で Metadata: Read-only + 対象リポジトリ権限

# Zennフィード取得失敗時のフォールバック(JSON配列文字列)
# ZENN_FALLBACK_ARTICLES_JSON=[{"title":"...","link":"...","pubDate":"...","description":"...","tags":["product"]}]
ZENN_FALLBACK_ARTICLES_JSON=

# 予約バックエンド切替
# mock: モック応答
# gcp: Google Calendar + Meet + 招待 + SESメール
BOOKING_BACKEND_MODE=mock

# GCP連携時に必須
GOOGLE_CALENDAR_CALENDAR_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DELEGATED_USER_EMAIL=

# 任意（未指定時は既定値）
BOOKING_TIMEZONE=Asia/Tokyo
BOOKING_TIMEZONE_OFFSET=+09:00
BOOKING_SLOT_MINUTES=60
BOOKING_SLOT_START_HOUR=10
BOOKING_SLOT_END_HOUR=24

# AWS（DynamoDB: 予約者専用ページ / SES: 予約メール通知）
# インフラは dokkiitech-infra の aws/portfolio スタックで管理
# ※ AWS_* の素の名前は Vercel の予約済み変数のため BOOKING_AWS_* を使う
#    未設定時は SDK のデフォルトチェーン（ローカルの AWS プロファイル等）にフォールバック
BOOKING_AWS_ACCESS_KEY_ID=
BOOKING_AWS_SECRET_ACCESS_KEY=
BOOKING_AWS_REGION=ap-northeast-1
BOOKING_TABLE_NAME=portfolio-booking-portal
MAIL_FROM=booking@your-domain.com

# Discord webhook（コンシェルジュ通知）
DISCORD_CONCIERGE_WEBHOOK_URL=
BOOKING_ADMIN_BASE_URL=https://your-domain.com

# 予約者専用ページ
BOOKING_PORTAL_BASE_URL=https://your-domain.com

# Vercel Cron（MTGデイリーサマリー）
CRON_SECRET=
```

### MTGデイリーサマリー用の必須 env

- `CRON_SECRET`
  - `/api/cron/mtg-summary` の認証用
  - `Authorization: Bearer <CRON_SECRET>` または `x-cron-secret` を受け付けます
- `DISCORD_CONCIERGE_WEBHOOK_URL`
  - Discord の投稿先 webhook URL
- `BOOKING_TABLE_NAME`
- `BOOKING_AWS_ACCESS_KEY_ID` / `BOOKING_AWS_SECRET_ACCESS_KEY`
  - DynamoDB テーブルの当日・翌日分取得に使用

サマリーは今日・明日のどちらかに予約がある場合のみ送信します（0件の日はスキップ）。DynamoDB への接続に失敗した場合は Discord へは送らず、cron のレスポンス（500）で検知します。

## Zenn 連携仕様

- 1st: `https://zenn.dev/{username}/feed` (RSS)
- 2nd: `rss2json` 経由のフォールバック
- 3rd: `ZENN_FALLBACK_ARTICLES_JSON`

`/blog` は全記事、`/products` は `product` タグのみ表示します。

## 予約API契約（モード切替）

- Endpoint:
  - `GET /api/bookings?date=YYYY-MM-DD`（空き時間照会）
  - `POST /api/bookings`（予約確定）
  - `POST /api/bookings/manage/{id}/verify`（管理ページ認証）
  - `POST /api/bookings/manage/{id}/password`（初回パスワード設定）
  - `PATCH /api/bookings/manage/{id}`（予約変更）
  - `DELETE /api/bookings/manage/{id}`（予約キャンセル）
- Request:

```json
{
  "name": "山田 太郎",
  "email": "taro@example.com",
  "company": "株式会社サンプル",
  "bookingType": "meet",
  "date": "2026-03-15",
  "timeSlot": "14:00",
  "agenda": "新規プロダクト相談",
  "location": "渋谷"
}
```

- 仕様:
  - `name` / `email` / `agenda` は必須
  - `company` は任意
  - `bookingType` は `meet` または `対面`
  - `bookingType=対面` の場合は `location` 必須
  - `BOOKING_BACKEND_MODE=mock` の場合はモック応答
  - `BOOKING_BACKEND_MODE=gcp` の場合:
    - Google Calendar FreeBusy で空き照会
    - 予約時に Calendar Event 作成 + ユーザーへ招待送信
    - `meet` の場合は Meet URL 自動発行
    - `対面` の場合は `location` をイベント場所に設定
    - SES 設定時（`MAIL_FROM`）は予約完了メールを送信
    - Discord webhook 設定時は、リッチ通知を Discord に送信（名前・アイコンは webhook 側の設定を使用）
    - attendees招待を有効にするには、Google Workspace の Domain-Wide Delegation + `GOOGLE_DELEGATED_USER_EMAIL` が必要
  - DynamoDB設定済みの場合は、予約後に `managePortal.url`（予約者専用ページURL）を返却
  - SESメール本文に `managePortal.url` とパスワードを同梱
  - 予約者ページでの変更/キャンセルは、`gcp` モード時に Google Calendar イベントにも同期

## DynamoDBテーブル（portfolio-booking-portal）

- 定義は dokkiitech-infra の `aws/portfolio/dynamodb.tf`（PAY_PER_REQUEST、PK `id`、GSI `booking_id-index`）
- レコードの属性は Supabase 時代の `booking_portal` テーブルと同じスネークケース
  （`id` / `booking_id` / `name` / `email` / `company` / `booking_type` / `date` / `time_slot` / `agenda` /
  `location` / `status` / `calendar_event_id` / `calendar_event_url` / `meet_url` / `manage_token_hash` /
  `manage_password_hash` / `expires_at` / `created_at` / `updated_at`）
- 旧 Supabase からのデータ移行: `node scripts/migrate-supabase-to-dynamodb.mjs`（冪等）

## Vercel デプロイ手順

1. GitHub に push
2. Vercel で `dokkiitech/portfolio` を Import
3. Build Settings
   - Framework Preset: `Next.js`
   - Install Command: `pnpm install`（または lockfile 準拠）
   - Build Command: `pnpm build`
4. Environment Variables に上記 `.env.local` と同じ値を設定
5. Deploy

## Vercel Cron 設定

- エンドポイント: `/api/cron/mtg-summary`
- 実行時刻: 毎日 09:00 JST
- Vercel cron の schedule: `0 0 * * *`

Vercel Cron の cron 式は UTC 基準です。  
09:00 JST は UTC では 00:00 のため、`0 0 * * *` を設定します。

`vercel.json` の例:

```json
{
  "crons": [
    {
      "path": "/api/cron/mtg-summary",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### MTGサマリーの内容

Discord には以下 3 セクションを日本語で投稿します。

- `今日のMTG`
- `明日のMTG`
- `DBアクセス状況`

当日・翌日に有効な予約が 0 件の場合は各セクションで `なし` を明示します。  
Supabase の env 不足やクエリ失敗時も、`DBアクセス状況` に `Supabase 未照会` または `Supabase 取得失敗` を明記します。

管理画面 `/appointment/admin` には、同じサマリーを即時送信する手動実行ボタンもあります。

## 検証コマンド

```bash
pnpm lint
pnpm build
```
