import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { awsClientConfig } from "@/lib/aws"

let client: SESv2Client | null = null

function getClient(): SESv2Client {
  if (!client) {
    client = new SESv2Client(awsClientConfig())
  }
  return client
}

export async function sendMail(
  to: string,
  subject: string,
  body: { html: string; text: string },
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
            Body: {
              Html: { Data: body.html, Charset: "UTF-8" },
              Text: { Data: body.text, Charset: "UTF-8" },
            },
          },
        },
      })
    )
  } catch (error) {
    return { sent: false, reason: String(error) }
  }

  return { sent: true }
}
