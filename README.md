# DOKKIITECH Portfolio

Next.js (App Router) で構築したポートフォリオサイトです。  
トップページで `Terminal Mode / UI Mode` を切り替え、プロフィール・ブログ・Product・SNS を閲覧できます。

## 実装ポイント

- ヘッダートグル: `Terminal Mode / UI Mode`
- 日本語UI
- ブログ連携: Zenn 投稿一覧
- Product連携: Zenn の `product` タグ記事のみ表示
- 予約ページ: `meet / 対面` 選択、対面時は場所必須バリデーション
- 予約 API: Google Calendar 連携を見据えた API 契約 + モック実装
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

# Zennフィード取得失敗時のフォールバック(JSON配列文字列)
# ZENN_FALLBACK_ARTICLES_JSON=[{"title":"...","link":"...","pubDate":"...","description":"...","tags":["product"]}]
ZENN_FALLBACK_ARTICLES_JSON=

# 予約バックエンド切替
# mock: 常にモック応答
# api: BOOKING_API_URL に転送
BOOKING_BACKEND_MODE=mock
BOOKING_API_URL=
BOOKING_API_KEY=
```

## Zenn 連携仕様

- 1st: `https://zenn.dev/{username}/feed` (RSS)
- 2nd: `rss2json` 経由のフォールバック
- 3rd: `ZENN_FALLBACK_ARTICLES_JSON`

`/blog` は全記事、`/products` は `product` タグのみ表示します。

## 予約API契約（モード切替）

- Endpoint: `POST /api/bookings`
- Request:

```json
{
  "name": "山田 太郎",
  "email": "taro@example.com",
  "bookingType": "meet",
  "date": "2026-03-15 14:00",
  "agenda": "新規プロダクト相談",
  "location": "渋谷"
}
```

- 仕様:
  - `bookingType` は `meet` または `対面`
  - `bookingType=対面` の場合は `location` 必須
  - `BOOKING_BACKEND_MODE=mock` の場合はモック応答
  - `BOOKING_BACKEND_MODE=api` の場合は `BOOKING_API_URL` に POST 転送

## Vercel デプロイ手順

1. GitHub に push
2. Vercel で `dokkiitech/portfolio` を Import
3. Build Settings
   - Framework Preset: `Next.js`
   - Install Command: `pnpm install`（または lockfile 準拠）
   - Build Command: `pnpm build`
4. Environment Variables に上記 `.env.local` と同じ値を設定
5. Deploy

## 検証コマンド

```bash
pnpm lint
pnpm build
```
