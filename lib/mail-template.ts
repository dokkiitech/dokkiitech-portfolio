// 予約関連メールの共通 HTML テンプレート。
// メールクライアント互換のため table レイアウト + インライン style で組む（外部 CSS / flex / grid は使わない）。

const BRAND_RED = "#D12D4E"
const TEXT = "#111827"
const MUTED = "#6B7280"
const BORDER = "#E5E7EB"
const SURFACE = "#F9FAFB"
const PAGE_BG = "#F3F4F6"

function getAssetBaseUrl(): string {
  return (process.env.MAIL_ASSET_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.dokkiitech.com").replace(/\/$/, "")
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export interface MailDetailRow {
  label: string
  value: string
  href?: string
  // 変更前の値（取り消し線で併記する）
  before?: string
}

export interface BookingMailContent {
  // メール冒頭の小見出し（例: 予約完了）
  badge: string
  title: string
  salutation: string
  paragraphs: string[]
  rows: MailDetailRow[]
  // 目立たせたいお知らせ（例: 管理者による変更）
  notice?: string
  button?: { label: string; href: string }
  // ボタン下などに出す補足（ラベル付きの値、例: パスワード）
  extras?: Array<{ label: string; value: string; href?: string }>
  closing?: string[]
}

function renderValue(value: string, href?: string): string {
  const escaped = escapeHtml(value)
  if (!href) return escaped
  return `<a href="${escapeHtml(href)}" style="color:${BRAND_RED};text-decoration:underline;word-break:break-all;">${escaped}</a>`
}

function renderRows(rows: MailDetailRow[]): string {
  return rows
    .map(
      (row, idx) => `
          <tr>
            <td style="padding:12px 16px;${idx > 0 ? `border-top:1px solid ${BORDER};` : ""}width:96px;vertical-align:top;font-size:13px;color:${MUTED};white-space:nowrap;">${escapeHtml(row.label)}</td>
            <td style="padding:12px 16px;${idx > 0 ? `border-top:1px solid ${BORDER};` : ""}vertical-align:top;font-size:15px;color:${TEXT};font-weight:600;word-break:break-word;">
              ${row.before ? `<div style="font-size:13px;font-weight:400;color:${MUTED};text-decoration:line-through;margin-bottom:2px;">${escapeHtml(row.before)}</div>` : ""}
              ${renderValue(row.value, row.href)}
            </td>
          </tr>`
    )
    .join("")
}

export function renderBookingMail(content: BookingMailContent): { html: string; text: string } {
  const logoUrl = `${getAssetBaseUrl()}/mail/dokkiitech-logo.png`
  const paragraphs = content.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:${TEXT};">${escapeHtml(p)}</p>`)
    .join("")
  const closing = (content.closing || [])
    .map((p) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.8;color:${TEXT};">${escapeHtml(p)}</p>`)
    .join("")
  const extras = (content.extras || [])
    .map(
      (extra) =>
        `<p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${TEXT};"><span style="color:${MUTED};">${escapeHtml(extra.label)}：</span><strong>${renderValue(extra.value, extra.href)}</strong></p>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(content.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',Meiryo,Arial,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.title)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
        <tr><td style="height:6px;background:${BRAND_RED};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td align="center" style="padding:28px 24px 8px;">
            <img src="${logoUrl}" width="160" alt="DOKKIITECH" style="display:block;width:160px;max-width:60%;height:auto;border:0;" />
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 24px 4px;">
            <span style="display:inline-block;padding:4px 12px;border:1px solid ${BRAND_RED};border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;color:${BRAND_RED};">${escapeHtml(content.badge)}</span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 24px 24px;">
            <h1 style="margin:0;font-size:22px;line-height:1.5;color:${TEXT};font-weight:800;">${escapeHtml(content.title)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:${TEXT};font-weight:700;">${escapeHtml(content.salutation)}</p>
            ${paragraphs}
            ${
              content.notice
                ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;">
              <tr><td style="padding:12px 16px;background:#FDF2F4;border-left:4px solid ${BRAND_RED};border-radius:4px;font-size:14px;line-height:1.7;color:${TEXT};font-weight:600;">${escapeHtml(content.notice)}</td></tr>
            </table>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding:4px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};border:1px solid ${BORDER};border-radius:8px;">
              ${renderRows(content.rows)}
            </table>
          </td>
        </tr>
        ${
          content.button
            ? `<tr>
          <td align="center" style="padding:24px 32px 8px;">
            <a href="${escapeHtml(content.button.href)}" style="display:inline-block;padding:14px 28px;background:${BRAND_RED};border-radius:8px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(content.button.label)}</a>
          </td>
        </tr>`
            : ""
        }
        ${extras ? `<tr><td style="padding:16px 32px 0;">${extras}</td></tr>` : ""}
        <tr>
          <td style="padding:20px 32px 28px;">
            ${closing}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;background:${SURFACE};border-top:1px solid ${BORDER};">
            <p style="margin:0 0 6px;font-size:12px;line-height:1.7;color:${MUTED};">このメールアドレスは送信専用です。ご返信いただいてもお答えできません。</p>
            <p style="margin:0 0 6px;font-size:12px;line-height:1.7;color:${MUTED};">メールでのご連絡は <a href="mailto:info&#64;dokkiitech.com" style="color:${MUTED};">info&#64;dokkiitech.com</a> へお願いします。</p>
            <p style="margin:0 0 14px;font-size:12px;line-height:1.7;color:${MUTED};">SNSでのご連絡は <a href="https://www.dokkiitech.com/contact" style="color:${MUTED};">https://www.dokkiitech.com/contact</a> からお願いします。</p>
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;color:${TEXT};">DOKKIITECH</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const textLines = [
    content.title,
    "",
    content.salutation,
    "",
    ...content.paragraphs,
    ...(content.notice ? ["", `■ ${content.notice}`] : []),
    "",
    ...content.rows.map((row) => `${row.label}：${row.value}${row.before ? `（変更前：${row.before}）` : ""}`),
    ...(content.button ? ["", `${content.button.label}：${content.button.href}`] : []),
    ...(content.extras || []).map((extra) => `${extra.label}：${extra.value}`),
    ...(content.closing?.length ? ["", ...content.closing] : []),
    "",
    "----",
    "このメールアドレスは送信専用です。",
    "メールでのご連絡は info@dokkiitech.com へお願いします。",
    "SNSでのご連絡は https://www.dokkiitech.com/contact からお願いします。",
  ]

  return { html, text: textLines.join("\n") }
}
