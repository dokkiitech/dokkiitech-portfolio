// Supabase booking_portal → DynamoDB portfolio-booking-portal の一回きり移行スクリプト
// 実行: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... BOOKING_TABLE_NAME=portfolio-booking-portal \
//       AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... node scripts/migrate-supabase-to-dynamodb.mjs
// 同一 id は上書きするため再実行しても安全(冪等)

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const tableName = process.env.BOOKING_TABLE_NAME || "portfolio-booking-portal"

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  process.exit(1)
}

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-1" }),
  { marshallOptions: { removeUndefinedValues: true } }
)

const response = await fetch(`${supabaseUrl}/rest/v1/booking_portal?select=*&order=created_at.asc`, {
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  },
})

if (!response.ok) {
  console.error(`Failed to fetch from Supabase: ${response.status} ${await response.text()}`)
  process.exit(1)
}

const rows = await response.json()
console.log(`Fetched ${rows.length} rows from Supabase booking_portal`)

let migrated = 0
for (const row of rows) {
  await docClient.send(new PutCommand({ TableName: tableName, Item: row }))
  migrated += 1
  console.log(`  [${migrated}/${rows.length}] ${row.booking_id} (${row.date} ${row.time_slot}, ${row.status})`)
}

console.log(`Done: migrated ${migrated} rows into ${tableName}`)
