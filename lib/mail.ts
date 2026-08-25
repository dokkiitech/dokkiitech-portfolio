import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"

const MAIL_COMMON_FOOTER_HTML = `
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
<p style="color:#4b5563;font-size:13px;line-height:1.7;">
このメールアドレスは送信専用です。<br />
メールでのご連絡はinfo&#64;dokkiitech.comにお願いします<br />
SNSでのご連絡は <a href="https://www.dokkiitech.com/contact">https://www.dokkiitech.com/contact</a> からお願いします。
</p>
`

let client: SESv2Client | null = null

function getClient(): SESv2Client {
  if (!client) {
    client = new SESv2Client({ region: process.env.AWS_REGION || "ap-northeast-1" })
  }
  return client
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  senderName = "dokkiitech予約管理システム",
  fromAddressOverride?: string
) {
  const from = process.env.MAIL_FROM
  if (!from) return { sent: false, reason: "MAIL_FROM missing" }
  const defaultFromAddress = from.includes("<") ? from.match(/<([^>]+)>/)?.[1] || from : from
  const fromAddress = fromAddressOverride || defaultFromAddress
  const fromHeader = `${senderName} <${fromAddress}>`

  try {
    await getClient().send(
      new SendEmailCommand({
        FromEmailAddress: fromHeader,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Html: { Data: `${html}${MAIL_COMMON_FOOTER_HTML}`, Charset: "UTF-8" } },
          },
        },
      })
    )
  } catch (error) {
    return { sent: false, reason: String(error) }
  }

  return { sent: true }
}
