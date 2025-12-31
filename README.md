# DOKKIITECH Portfolio

木戸亮輔のポートフォリオサイト。Zennブログと連携し、プロダクトや技術記事を紹介しています。

## 主な機能

- **Zennブログ連携**: ZennのRSSフィードから記事を自動取得
- **Productsページ**: Zennで"Product"タグがついた記事を表示
- **Blogページ**: すべてのZenn記事を表示
- **Homeページ**: 上位3件のProduct記事を表示
- **ダークモード対応**: ライト/ダークテーマの切り替え
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: Radix UI
- **アイコン**: Lucide React
- **パッケージマネージャー**: pnpm

## セットアップ

### 前提条件

- Node.js 18以上
- pnpm 10以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/dokkiitech/portfolio.git
cd portfolio

# 依存関係をインストール
pnpm install
```

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

### ビルド

```bash
pnpm build
```

### 本番サーバーの起動

```bash
pnpm start
```

ポート3006で起動します。

## ディレクトリ構造

```
portfolio/
├── app/                    # Next.js App Router
│   ├── about/             # Aboutページ
│   ├── blog/              # Blogページ（全記事）
│   ├── contact/           # Contactページ
│   ├── products/          # Productsページ（Productタグの記事）
│   ├── appoint/           # 予約ページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # Homeページ
├── components/            # Reactコンポーネント
│   ├── ui/               # 再利用可能なUIコンポーネント
│   ├── blog-card.tsx     # ブログ記事カード
│   ├── latest-products.tsx # 最新プロダクト表示
│   ├── navigation.tsx    # ナビゲーションバー
│   └── ...
├── lib/                   # ユーティリティ関数
│   ├── zenn.ts           # Zenn RSS取得・パース処理
│   └── utils.ts          # 汎用ユーティリティ
└── public/               # 静的ファイル
```

## Zennブログ連携

### 仕組み

1. ZennのRSSフィード (`https://zenn.dev/{username}/feed`) から記事を取得
2. 1時間ごとにキャッシュを再検証 (ISR)
3. タグでフィルタリングして表示

### Productタグの活用

Zennで記事を投稿する際に **"Product"** タグをつけると：
- `/products` ページに表示される
- Homeページの "Latest Products" セクションに上位3件が表示される

### カスタマイズ

`lib/zenn.ts` でZennのユーザー名を変更できます：

```typescript
// 例: Blogページ
const articles = await getZennArticles("dokkiitech")

// 例: Productsページ
const articles = await getZennProductArticles("dokkiitech")
```

## 開発のポイント

### コンポーネントの遅延読み込み

パフォーマンス最適化のため、以下のコンポーネントは遅延読み込みを使用：
- `CodeAnimation`
- `LatestProducts`

### キャッシュ戦略

- ZennのRSSフィード: 1時間ごとに再検証 (`revalidate: 3600`)
- ISR (Incremental Static Regeneration) を活用して、静的生成とデータの鮮度を両立

### HTMLタグとCDATAの処理

ZennのRSSフィードに含まれるHTMLタグやCDATAセクションは、`stripHTMLTags`関数で自動的に除去されます。

## ライセンス

Private

## 作者

木戸亮輔 (DOKKIITECH)

- Website: [dokkiitech.com](https://dokkiitech.com)
- Zenn: [@dokkiitech](https://zenn.dev/dokkiitech)
# dokkiitech HP
木戸亮輔のプロフィールを表示するHPです。
