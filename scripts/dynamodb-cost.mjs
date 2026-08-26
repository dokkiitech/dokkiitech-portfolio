#!/usr/bin/env node
// DynamoDB（予約ポータル: lib/booking-portal.ts）のコスト計測スクリプト。
//
//   node scripts/dynamodb-cost.mjs                 # モデル試算（AWS 接続なし）
//   node scripts/dynamodb-cost.mjs --mode=metrics  # CloudWatch の実消費キャパシティから実測
//   node scripts/dynamodb-cost.mjs --mode=billing  # Cost Explorer の実請求額を取得
//   node scripts/dynamodb-cost.mjs --mode=selftest # SigV4 署名の自己検証
//
// 依存パッケージなし（SigV4 は node:crypto で自前署名）。
// metrics/billing モードに必要な IAM 権限（アプリ用の portfolio-app には無い）:
//   metrics : cloudwatch:GetMetricStatistics, dynamodb:DescribeTable
//   billing : ce:GetCostAndUsage
import { createHmac, createHash } from "node:crypto"

// ---------------------------------------------------------------- 料金定数
// ap-northeast-1 / オンデマンド（2024-11 の値下げ後）。最新値は必ず
// https://aws.amazon.com/jp/dynamodb/pricing/on-demand/ で確認すること。
const PRICE = {
  region: "ap-northeast-1",
  writeRequestUnitPerMillionUsd: 0.7135,
  readRequestUnitPerMillionUsd: 0.1427,
  storagePerGbMonthUsd: 0.285,
  freeStorageGb: 25,
  pitrPerGbMonthUsd: 0.228,
}

// -------------------------------------------------- コードから導いたアクセスパターン
// 1 アイテム ≒ 906 バイト（scripts と同じ実測値: 全属性が埋まった代表レコード）。
// 1KB 未満 → 書き込み 1 WRU、4KB 未満 → 結果整合性読み込み 0.5 RRU。
const DEFAULT_ITEM_BYTES = 906
const RRU_PER_4KB = 0.5

const ACCESS_PATTERNS = [
  {
    key: "bookings",
    label: "POST /api/bookings（予約確定）",
    detail: "Query(booking_id-index, Limit 1) + Put(条件付き) + GSI への書き込み",
    rru: () => 0.5,
    wru: () => 2, // ベーステーブル 1 + GSI 1
  },
  {
    key: "bookingsRejected",
    label: "POST /api/bookings（バリデーションで 400 になった分）",
    detail: "generateBookingReference() がバリデーション前に走るため Query だけ発生する",
    rru: () => 0.5,
    wru: () => 0,
  },
  {
    key: "verifies",
    label: "POST /api/bookings/manage/{id}/verify（管理ページ認証）",
    detail: "GetItem（結果整合性）",
    rru: () => 0.5,
    wru: () => 0,
  },
  {
    key: "passwordSets",
    label: "POST /api/bookings/manage/{id}/password（初回パスワード設定）",
    detail: "GetItem + UpdateItem",
    rru: () => 0.5,
    wru: () => 1,
  },
  {
    key: "updates",
    label: "PATCH /api/bookings/manage/{id}（予約変更）",
    detail: "GetItem + UpdateItem",
    rru: () => 0.5,
    wru: () => 1,
  },
  {
    key: "cancels",
    label: "DELETE /api/bookings/manage/{id}（キャンセル）",
    detail: "GetItem + UpdateItem",
    rru: () => 0.5,
    wru: () => 1,
  },
  {
    key: "adminViews",
    label: "GET /api/bookings/admin（管理一覧）",
    detail: "全件 Scan（FilterExpression は読み込み量を減らさない）",
    rru: (p) => scanRru(p),
    wru: () => 0,
  },
  {
    key: "cronScans",
    label: "GET /api/cron/mtg-summary（日次 cron）",
    detail: "今日・明日ぶんで全件 Scan × 2",
    rru: (p) => scanRru(p) * 2,
    wru: () => 0,
  },
]

// Scan は評価したアイテムの合計サイズで課金される（返却件数ではない）。
function scanRru(profile) {
  const bytes = profile.items * profile.itemBytes
  return Math.ceil(bytes / 4096) * RRU_PER_4KB
}

// ---------------------------------------------------------------- 引数
function parseArgs(argv) {
  const out = {}
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(arg)
    if (!m) continue
    out[m[1]] = m[2] === undefined ? true : m[2]
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const num = (name, fallback) => (args[name] === undefined ? fallback : Number(args[name]))

const profile = {
  items: num("items", 200), // テーブルの総アイテム数
  itemBytes: num("item-bytes", DEFAULT_ITEM_BYTES),
  monthly: {
    bookings: num("bookings", 20),
    bookingsRejected: num("bookings-rejected", 10),
    verifies: num("verifies", 60),
    passwordSets: num("password-sets", 16),
    updates: num("updates", 4),
    cancels: num("cancels", 2),
    adminViews: num("admin-views", 60),
    cronScans: num("cron-scans", 30), // 日次 cron（1 回あたり Scan 2 本）
  },
}

const jpyRate = num("jpy", 150)
const usd = (v) => `$${v.toFixed(6)}`
const jpy = (v) => `¥${(v * jpyRate).toFixed(2)}`

// ---------------------------------------------------------------- モデル試算
function runModel() {
  console.log(`# DynamoDB コスト試算（モデル / ${PRICE.region} オンデマンド）\n`)
  console.log(
    `前提: テーブル ${profile.items} 件 / 1 アイテム ${profile.itemBytes} バイト / 為替 ${jpyRate} 円\n`
  )

  const rows = []
  let totalRru = 0
  let totalWru = 0

  for (const p of ACCESS_PATTERNS) {
    const count = profile.monthly[p.key] ?? 0
    const rruEach = p.rru(profile)
    const wruEach = p.wru(profile)
    const rru = rruEach * count
    const wru = wruEach * count
    totalRru += rru
    totalWru += wru
    rows.push({ label: p.label, detail: p.detail, count, rruEach, wruEach, rru, wru })
  }

  for (const r of rows) {
    console.log(`- ${r.label}`)
    console.log(`    ${r.detail}`)
    console.log(
      `    月 ${r.count} 回 × (読み ${r.rruEach} RRU / 書き ${r.wruEach} WRU) = 読み ${r.rru.toFixed(1)} RRU / 書き ${r.wru.toFixed(1)} WRU`
    )
  }

  const readUsd = (totalRru / 1_000_000) * PRICE.readRequestUnitPerMillionUsd
  const writeUsd = (totalWru / 1_000_000) * PRICE.writeRequestUnitPerMillionUsd

  const storageGb = (profile.items * (profile.itemBytes + 157)) / 1024 ** 3 // +157B ≒ GSI(KEYS_ONLY)
  const billableStorageGb = Math.max(0, storageGb - PRICE.freeStorageGb)
  const storageUsd = billableStorageGb * PRICE.storagePerGbMonthUsd

  const total = readUsd + writeUsd + storageUsd

  console.log(`\n## 月額合計`)
  console.log(`  読み込み : ${totalRru.toFixed(1)} RRU  → ${usd(readUsd)} / ${jpy(readUsd)}`)
  console.log(`  書き込み : ${totalWru.toFixed(1)} WRU  → ${usd(writeUsd)} / ${jpy(writeUsd)}`)
  console.log(
    `  ストレージ: ${(storageGb * 1024).toFixed(3)} MB（無料枠 ${PRICE.freeStorageGb} GB 内）→ ${usd(storageUsd)} / ${jpy(storageUsd)}`
  )
  console.log(`  ------------------------------------------`)
  console.log(`  合計     : ${usd(total)} / ${jpy(total)}\n`)

  const scanShare = rows
    .filter((r) => r.label.includes("admin") || r.label.includes("cron"))
    .reduce((acc, r) => acc + r.rru, 0)
  if (totalRru > 0) {
    console.log(
      `Scan（管理一覧 + cron）が読み込みキャパシティの ${((scanShare / totalRru) * 100).toFixed(1)}% を占めています。`
    )
    console.log(
      `Scan の消費はテーブル件数に線形で増えます: 1 Scan = ${scanRru(profile).toFixed(1)} RRU（${profile.items} 件時）。`
    )
  }
}

// ---------------------------------------------------------------- SigV4
function sign(key, msg) {
  return createHmac("sha256", key).update(msg, "utf8").digest()
}

function sigv4Headers({
  service,
  region,
  host,
  target,
  body,
  credentials,
  contentType,
  amzDate,
  method = "POST",
  canonicalQuery = "",
}) {
  const date = amzDate.slice(0, 8)
  const payloadHash = createHash("sha256").update(body, "utf8").digest("hex")

  const headers = {
    host,
    "content-type": contentType,
    "x-amz-date": amzDate,
    ...(target ? { "x-amz-target": target } : {}),
    ...(credentials.sessionToken ? { "x-amz-security-token": credentials.sessionToken } : {}),
  }

  const signedHeaders = Object.keys(headers).sort().join(";")
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k}:${String(headers[k]).trim()}\n`)
    .join("")

  const canonicalRequest = [method, "/", canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n")
  const scope = `${date}/${region}/${service}/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    createHash("sha256").update(canonicalRequest, "utf8").digest("hex"),
  ].join("\n")

  let k = sign(`AWS4${credentials.secretAccessKey}`, date)
  k = sign(k, region)
  k = sign(k, service)
  k = sign(k, "aws4_request")
  const signature = createHmac("sha256", k).update(stringToSign, "utf8").digest("hex")

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

function getCredentials() {
  const accessKeyId = process.env.BOOKING_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.BOOKING_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.BOOKING_AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS 認証情報が見つかりません。BOOKING_AWS_ACCESS_KEY_ID / BOOKING_AWS_SECRET_ACCESS_KEY を設定してください。"
    )
  }
  return { accessKeyId, secretAccessKey, sessionToken }
}

async function awsRequest({ service, region, target, body, contentType }) {
  const host = `${service === "monitoring" ? "monitoring" : service}.${region}.amazonaws.com`
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "")
  const headers = sigv4Headers({
    service,
    region,
    host,
    target,
    body,
    contentType,
    amzDate,
    credentials: getCredentials(),
  })
  const res = await fetch(`https://${host}/`, { method: "POST", headers, body })
  const text = await res.text()
  if (!res.ok) throw new Error(`${service} ${res.status}: ${text.slice(0, 500)}`)
  return text
}

// ---------------------------------------------------------------- metrics モード
function tableName() {
  return args.table || process.env.BOOKING_TABLE_NAME || "portfolio-booking-portal"
}

function region() {
  return args.region || process.env.BOOKING_AWS_REGION || PRICE.region
}

function parseDatapointSums(xml) {
  return [...xml.matchAll(/<Sum>([^<]+)<\/Sum>/g)].map((m) => Number(m[1]))
}

async function metricSum({ metricName, days, dimensions }) {
  const end = new Date()
  const start = new Date(end.getTime() - days * 86400_000)
  const params = new URLSearchParams({
    Action: "GetMetricStatistics",
    Version: "2010-08-01",
    Namespace: "AWS/DynamoDB",
    MetricName: metricName,
    StartTime: start.toISOString(),
    EndTime: end.toISOString(),
    Period: "86400",
    "Statistics.member.1": "Sum",
  })
  dimensions.forEach((d, i) => {
    params.set(`Dimensions.member.${i + 1}.Name`, d.Name)
    params.set(`Dimensions.member.${i + 1}.Value`, d.Value)
  })

  const xml = await awsRequest({
    service: "monitoring",
    region: region(),
    body: params.toString(),
    contentType: "application/x-www-form-urlencoded; charset=utf-8",
  })
  return parseDatapointSums(xml).reduce((a, b) => a + b, 0)
}

async function describeTable() {
  const json = await awsRequest({
    service: "dynamodb",
    region: region(),
    target: "DynamoDB_20120810.DescribeTable",
    body: JSON.stringify({ TableName: tableName() }),
    contentType: "application/x-amz-json-1.0",
  })
  return JSON.parse(json).Table
}

async function runMetrics() {
  const days = num("days", 30)
  const table = tableName()
  console.log(`# DynamoDB コスト実測（CloudWatch / 直近 ${days} 日 / ${table}）\n`)

  const t = await describeTable()
  const indexes = (t.GlobalSecondaryIndexes || []).map((i) => i.IndexName)

  const targets = [{ label: "テーブル本体", dimensions: [{ Name: "TableName", Value: table }] }]
  for (const idx of indexes) {
    targets.push({
      label: `GSI ${idx}`,
      dimensions: [
        { Name: "TableName", Value: table },
        { Name: "GlobalSecondaryIndexName", Value: idx },
      ],
    })
  }

  let totalRru = 0
  let totalWru = 0
  for (const target of targets) {
    const [rru, wru] = await Promise.all([
      metricSum({ metricName: "ConsumedReadCapacityUnits", days, dimensions: target.dimensions }),
      metricSum({ metricName: "ConsumedWriteCapacityUnits", days, dimensions: target.dimensions }),
    ])
    totalRru += rru
    totalWru += wru
    console.log(`- ${target.label}: 読み ${rru.toFixed(1)} RRU / 書き ${wru.toFixed(1)} WRU`)
  }

  const storageGb = Number(t.TableSizeBytes || 0) / 1024 ** 3
  const readUsd = (totalRru / 1_000_000) * PRICE.readRequestUnitPerMillionUsd
  const writeUsd = (totalWru / 1_000_000) * PRICE.writeRequestUnitPerMillionUsd
  const storageUsd = Math.max(0, storageGb - PRICE.freeStorageGb) * PRICE.storagePerGbMonthUsd
  const scale = 30 / days

  console.log(`\n  アイテム数 : ${t.ItemCount}`)
  console.log(`  テーブルサイズ: ${(storageGb * 1024).toFixed(3)} MB`)
  console.log(`  課金モード : ${t.BillingModeSummary?.BillingMode || "（未取得）"}`)
  console.log(`\n## 30 日換算`)
  console.log(`  読み込み : ${usd(readUsd * scale)} / ${jpy(readUsd * scale)}`)
  console.log(`  書き込み : ${usd(writeUsd * scale)} / ${jpy(writeUsd * scale)}`)
  console.log(`  ストレージ: ${usd(storageUsd)} / ${jpy(storageUsd)}`)
  console.log(`  合計     : ${usd(readUsd * scale + writeUsd * scale + storageUsd)}`)
}

// ---------------------------------------------------------------- billing モード
async function runBilling() {
  const months = num("months", 3)
  const end = new Date()
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 1))
  const body = JSON.stringify({
    TimePeriod: { Start: start.toISOString().slice(0, 10), End: end.toISOString().slice(0, 10) },
    Granularity: "MONTHLY",
    Metrics: ["UnblendedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "USAGE_TYPE" }],
    Filter: { Dimensions: { Key: "SERVICE", Values: ["Amazon DynamoDB"] } },
  })

  // Cost Explorer は us-east-1 のみ
  const json = await awsRequest({
    service: "ce",
    region: "us-east-1",
    target: "AWSInsightsIndexService.GetCostAndUsage",
    body,
    contentType: "application/x-amz-json-1.1",
  })

  console.log(`# DynamoDB 実請求額（Cost Explorer / 直近 ${months} ヶ月）\n`)
  for (const period of JSON.parse(json).ResultsByTime) {
    console.log(`## ${period.TimePeriod.Start} 〜 ${period.TimePeriod.End}`)
    let sum = 0
    for (const g of period.Groups) {
      const amount = Number(g.Metrics.UnblendedCost.Amount)
      sum += amount
      if (amount > 0) console.log(`  ${g.Keys[0]}: $${amount.toFixed(6)}`)
    }
    console.log(`  合計: ${usd(sum)} / ${jpy(sum)}\n`)
  }
}

// ---------------------------------------------------------------- selftest
// AWS 公式ドキュメントの Signature Version 4 計算例（GET iam ListUsers）で
// 署名ロジックを検証する。認証情報なしで実行可能。
function runSelfTest() {
  const headers = sigv4Headers({
    method: "GET",
    service: "iam",
    region: "us-east-1",
    host: "iam.amazonaws.com",
    canonicalQuery: "Action=ListUsers&Version=2010-05-08",
    body: "",
    contentType: "application/x-www-form-urlencoded; charset=utf-8",
    amzDate: "20150830T123600Z",
    credentials: {
      accessKeyId: "AKIDEXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    },
  })
  const expected = "5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7"
  const actual = /Signature=([0-9a-f]+)/.exec(headers.authorization)?.[1]
  if (actual === expected) {
    console.log("SigV4 selftest: OK")
    return
  }
  console.error(`SigV4 selftest: NG\n  expected ${expected}\n  actual   ${actual}`)
  process.exit(1)
}

// ---------------------------------------------------------------- entry
const mode = args.mode || "model"
try {
  if (mode === "selftest") runSelfTest()
  else if (mode === "model") runModel()
  else if (mode === "metrics") await runMetrics()
  else if (mode === "billing") await runBilling()
  else {
    console.error(`未知のモード: ${mode}（model | metrics | billing | selftest）`)
    process.exit(1)
  }
} catch (error) {
  console.error(`エラー: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
