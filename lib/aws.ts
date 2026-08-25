// Vercel は AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION を予約済み変数として
// 弾く(実行基盤の Lambda が自前の値を注入する)ため、独自プレフィックスの env から
// 明示的にクレデンシャルを渡す。未設定ならローカル用に SDK のデフォルトチェーンへ委ねる。
export function awsClientConfig() {
  const accessKeyId = process.env.BOOKING_AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.BOOKING_AWS_SECRET_ACCESS_KEY
  return {
    region: process.env.BOOKING_AWS_REGION || "ap-northeast-1",
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  }
}
