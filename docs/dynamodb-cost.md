# DynamoDB コスト計測

対象は予約者専用ページのテーブル `portfolio-booking-portal`（`ap-northeast-1` / PAY_PER_REQUEST）だけです。
DynamoDB を触っているコードは `lib/booking-portal.ts` の 1 ファイルに閉じており、他のモジュールは
すべてこのファイル経由で呼び出しています。

計測用スクリプト: `scripts/dynamodb-cost.mjs`（依存パッケージなし）

```bash
node scripts/dynamodb-cost.mjs                  # モデル試算（AWS 接続不要）
node scripts/dynamodb-cost.mjs --mode=metrics   # CloudWatch の実消費キャパシティから実測
node scripts/dynamodb-cost.mjs --mode=billing   # Cost Explorer の実請求額を取得
node scripts/dynamodb-cost.mjs --mode=selftest  # SigV4 署名ロジックの自己検証
```

`metrics` / `billing` はアプリ用 IAM ユーザー `portfolio-app`（DynamoDB CRUD + `ses:SendEmail` のみ）
では権限が足りません。以下を持つ認証情報で実行してください。

- `metrics`: `cloudwatch:GetMetricStatistics`, `dynamodb:DescribeTable`
- `billing`: `ce:GetCostAndUsage`

## アクセスパターン別のキャパシティ消費

代表レコード（全属性が埋まった状態）のアイテムサイズは **906 バイト**です。
1KB 未満なので書き込みは 1 WRU、4KB 未満なので結果整合性の読み込みは 0.5 RRU になります。

| 経路 | DynamoDB 操作 | 1 回あたり |
| --- | --- | --- |
| `POST /api/bookings` | `Query`(GSI `booking_id-index`, Limit 1) + `Put`(条件付き) | 0.5 RRU + 2 WRU (本体 1 + GSI 1) |
| `POST /api/bookings`（400 で終わる分） | `Query` のみ | 0.5 RRU |
| `POST /api/bookings/manage/{id}/verify` | `Get` | 0.5 RRU |
| `POST /api/bookings/manage/{id}/password` | `Get` + `Update` | 0.5 RRU + 1 WRU |
| `PATCH /api/bookings/manage/{id}` | `Get` + `Update` | 0.5 RRU + 1 WRU |
| `DELETE /api/bookings/manage/{id}` | `Get` + `Update` | 0.5 RRU + 1 WRU |
| `GET /api/bookings/admin` | **全件 `Scan`** | `ceil(件数 × 906 / 4096) × 0.5` RRU |
| `GET /api/cron/mtg-summary`（日次） | **全件 `Scan` × 2**（今日 / 明日） | 上記の 2 倍 |

補足:

- `listBookingPortals` の `FilterExpression`（`date` / `status`）は **読み込み量を減らしません**。
  Scan は評価したアイテム全部に課金され、フィルタは課金後に適用されます。
- `updatePortalFields` の `ReturnValues: "ALL_NEW"` に追加の読み込み課金はありません。
- GSI は `booking_id` のみをキーにするため、非キー属性の更新では GSI 側の書き込みが発生しません
  （射影が `KEYS_ONLY` である前提。定義は dokkiitech-infra 側）。
- `generateBookingReference()` は日付・時間帯のバリデーションより **前** に呼ばれるため、
  400 で弾かれるリクエストでも GSI Query が 1 回発生します。

## 試算結果（現状規模）

テーブル 200 件、月 20 件の予約、管理画面 60 回閲覧、cron 30 回という前提:

```
読み込み : 2,756.0 RRU  → $0.000393
書き込み :    62.0 WRU  → $0.000044
ストレージ:   0.203 MB（25GB 無料枠内）→ $0
------------------------------------------
合計     : $0.000438 / 月（約 0.07 円）
```

**実質ゼロ円**です。オンデマンドの最小課金単位を大きく下回るため、請求書上は
DynamoDB の行がほぼ $0.00 で並びます。ストレージも 25GB 無料枠に対して 0.2MB です。

## 効いてくるのは Scan だけ

読み込みキャパシティの **98%** が管理一覧と cron の全件 Scan です。しかも Scan の消費は
テーブル件数に比例して増え続けます（レコードは論理削除で `status: "canceled"` にするだけで
物理削除されないため、件数は単調増加します）。

| テーブル件数 | 1 Scan あたり | 月額合計 |
| --- | --- | --- |
| 200 | 22.5 RRU | $0.00044 |
| 2,000 | 221.5 RRU | $0.0038 |
| 100,000 | 11,060 RRU | 約 $0.19 |

100,000 件でも月 $0.2 程度なので、**コストの観点では対応不要**です。実際に問題になるのは
レイテンシとメモリ（Scan は 1MB ごとにページングし、全件をアプリ側の配列に載せてソートする）
の方で、数千件を超えたあたりから管理画面の応答が目に見えて遅くなります。

将来やるとしたら、コスト削減ではなくレイテンシ対策として:

1. `date` を PK にした GSI（`date-index`）を追加し、`listBookingPortals` の Scan を Query に置換する。
   cron も管理画面も日付指定なので、これで読み込みが「その日の件数ぶん」に落ちます。
2. `expires_at` を TTL 属性に設定して古いレコードを自動削除する（TTL の削除自体は無料）。

## 前提と注意

- 料金は `ap-northeast-1` オンデマンド（2024-11 の値下げ後）: 書き込み $0.7135/100万 WRU、
  読み込み $0.1427/100万 RRU、ストレージ $0.285/GB-月。最新値は
  https://aws.amazon.com/jp/dynamodb/pricing/on-demand/ で確認してください。
  スクリプト側の `PRICE` 定数を書き換えれば追随できます。
- PITR やオンデマンドバックアップを有効にしている場合は別途 $0.228/GB-月 程度が乗ります。
  現状の設定は dokkiitech-infra の `aws/portfolio/dynamodb.tf` を確認してください。
- 上記の試算はコードから導いた理論値です。実消費は `--mode=metrics`、実請求額は `--mode=billing`
  で確認できます。
