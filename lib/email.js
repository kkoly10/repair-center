import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@example.com'
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

function fmt(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

export async function sendEstimateReadyEmail({ to, customerName, quoteId, deviceDescription, totalAmount }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set – skipping estimate ready email')
    return
  }

  const reviewUrl = `${BASE_URL}/estimate-review/${quoteId}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your repair estimate is ready – Quote #${quoteId}`,
    html: estimateReadyHtml({ customerName, deviceDescription, totalAmount: fmt(totalAmount), reviewUrl, quoteId }),
  })
}

export async function sendShippingNotificationEmail({
  to,
  customerName,
  quoteId,
  orderNumber,
  carrier,
  trackingNumber,
  trackingUrl,
}) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set – skipping shipping notification email')
    return
  }

  const trackingPageUrl = `${BASE_URL}/track/${quoteId}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your repaired device has shipped${orderNumber ? ` – Order #${orderNumber}` : ''}`,
    html: shippingNotificationHtml({
      customerName,
      orderNumber,
      carrier,
      trackingNumber,
      trackingUrl,
      trackingPageUrl,
    }),
  })
}

function emailWrapper(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repair Center</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111;padding:24px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Repair Center</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa;">
            <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
              You received this email because a repair quote was submitted under this address.
              If this wasn't you, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function estimateReadyHtml({ customerName, deviceDescription, totalAmount, reviewUrl, quoteId }) {
  const firstName = customerName ? customerName.split(' ')[0] : 'there'

  return emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111;letter-spacing:-0.02em;">Your estimate is ready</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">Hi ${firstName}, your repair estimate is ready to review.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:6px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Device</p>
          <p style="margin:0 0 16px;font-size:15px;color:#111;font-weight:600;">${deviceDescription || 'Your device'}</p>
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Estimate total</p>
          <p style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700;">${totalAmount}</p>
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Quote ID</p>
          <p style="margin:0;font-size:13px;color:#555;font-family:monospace;">${quoteId}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">
      Review the line items and either approve or decline the estimate. Estimates expire after 14 days.
    </p>

    <a href="${reviewUrl}" style="display:inline-block;background:#111;color:#fff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:6px;text-decoration:none;letter-spacing:-0.01em;">
      Review Estimate →
    </a>

    <p style="margin:24px 0 0;font-size:13px;color:#999;">
      Or copy this link: <a href="${reviewUrl}" style="color:#555;">${reviewUrl}</a>
    </p>
  `)
}

function shippingNotificationHtml({ customerName, orderNumber, carrier, trackingNumber, trackingUrl, trackingPageUrl }) {
  const firstName = customerName ? customerName.split(' ')[0] : 'there'

  return emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111;letter-spacing:-0.02em;">Your device has shipped</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">Hi ${firstName}, your repaired device is on its way back to you.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:6px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          ${orderNumber ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Order number</p>
          <p style="margin:0 0 16px;font-size:15px;color:#111;font-weight:600;">#${orderNumber}</p>` : ''}
          ${carrier ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Carrier</p>
          <p style="margin:0 0 16px;font-size:15px;color:#111;">${carrier}</p>` : ''}
          ${trackingNumber ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Tracking number</p>
          <p style="margin:0;font-size:15px;color:#111;font-family:monospace;font-weight:600;">${trackingNumber}</p>` : ''}
        </td>
      </tr>
    </table>

    ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;background:#111;color:#fff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:6px;text-decoration:none;letter-spacing:-0.01em;margin-bottom:12px;">
      Track Package →
    </a><br>` : ''}

    <a href="${trackingPageUrl}" style="display:inline-block;background:#fff;color:#111;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;border:1px solid #e0e0e0;margin-top:8px;">
      View Repair Tracking Page
    </a>

    <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.6;">
      If you have any questions about your repair, you can reply to this email or visit your tracking page.
    </p>
  `)
}
