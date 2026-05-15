import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@example.com'
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

function fmt(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

export async function sendNewQuoteAlertEmail({ to, orgName, quoteId, customerName, device, repairType }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set – skipping new quote alert email')
    return
  }
  if (!to || (Array.isArray(to) && to.length === 0)) return

  const adminUrl = `${BASE_URL}/admin/quotes/${quoteId}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject: `New quote request – ${device || 'Device'}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em;">New quote request</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#555;">A customer just submitted a quote on <strong>${orgName}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Quote ID</p>
          <p style="margin:0 0 12px;font-size:14px;color:#111;font-family:monospace;">${quoteId}</p>
          ${customerName ? `<p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Customer</p>
          <p style="margin:0 0 12px;font-size:14px;color:#111;">${customerName}</p>` : ''}
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Device</p>
          <p style="margin:0 0 12px;font-size:14px;color:#111;">${device || 'Unknown'}</p>
          ${repairType ? `<p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Repair type</p>
          <p style="margin:0;font-size:14px;color:#111;">${repairType}</p>` : ''}
        </td></tr>
      </table>
      <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#2d6bff;color:#fff;font-size:14px;font-weight:600;border-radius:6px;text-decoration:none;">Review Quote</a>
    `, 'You received this alert because you are an owner or admin of this repair shop. Manage your notification preferences in your account settings.'),
  })
}

export async function sendTrialExpiryWarningEmail({ to, orgName, daysLeft, billingUrl }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set – skipping trial expiry warning email')
    return
  }

  const expired = daysLeft <= 0
  const subject = expired
    ? `Your RepairCenter trial has ended – ${orgName}`
    : `Your RepairCenter trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} – ${orgName}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: trialExpiryWarningHtml({ orgName, daysLeft, billingUrl, expired }),
  })
}

export async function sendReceiptEmail({ to, invoice }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set – skipping receipt email')
    return
  }

  const { org, quote, customer, order, estimate, line_items, payments } = invoice
  const subject = order?.order_number
    ? `Receipt – Order #${order.order_number} | ${org.name}`
    : `Receipt – Quote ${quote.quote_id} | ${org.name}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: receiptHtml({ org, quote, customer, order, estimate, line_items, payments }),
  })
}

function trialExpiryWarningHtml({ orgName, daysLeft, billingUrl, expired }) {
  const urgentColor = daysLeft <= 1 ? '#dc2626' : '#d97706'
  return emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111;letter-spacing:-0.02em;">
      ${expired ? 'Your free trial has ended' : `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      ${expired
        ? `Your 14-day free trial for <strong>${orgName}</strong> has expired. Upgrade to a paid plan to restore full access.`
        : `Your 14-day free trial for <strong>${orgName}</strong> will expire soon. Upgrade now to keep uninterrupted access to all features.`
      }
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:1px solid ${urgentColor};border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tr><td>
        <p style="margin:0;font-size:15px;font-weight:600;color:${urgentColor};">
          ${expired ? 'Trial expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
        </p>
        <p style="margin:6px 0 0;font-size:13px;color:#555;">
          ${expired
            ? 'Your account is now restricted. Upgrade to restore access.'
            : 'Upgrade before your trial ends to avoid any interruption to your workflow.'
          }
        </p>
      </td></tr>
    </table>

    <a href="${billingUrl}" style="display:inline-block;background:#111;color:#fff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:6px;text-decoration:none;letter-spacing:-0.01em;">
      Upgrade Now →
    </a>

    <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.5;">
      Questions? Reply to this email or visit your billing page at <a href="${billingUrl}" style="color:#555;">${billingUrl}</a>
    </p>
  `)
}

function emailWrapper(bodyHtml, footerNote = 'You received this email because a repair quote was submitted under this address. If this wasn\'t you, you can safely ignore this email.') {
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
            <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">${footerNote}</p>
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

function receiptHtml({ org, quote, customer, order, estimate, line_items, payments }) {
  const firstName = customer?.name ? customer.name.split(' ')[0] : 'there'
  const device = [quote.brand_name, quote.model_name].filter(Boolean).join(' ') || 'Your device'
  const repairType = quote.repair_type_key
    ? quote.repair_type_key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''

  const lineItemsHtml = line_items?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;padding:0 0 8px;border-bottom:1px solid #e0e0e0;">Description</th>
            <th align="right" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;padding:0 0 8px;border-bottom:1px solid #e0e0e0;">Qty</th>
            <th align="right" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;padding:0 0 8px;border-bottom:1px solid #e0e0e0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${line_items.map((item) => `
            <tr>
              <td style="font-size:14px;color:#111;padding:10px 0;border-bottom:1px solid #f0f0f0;">${item.description || '—'}</td>
              <td align="right" style="font-size:14px;color:#555;padding:10px 0;border-bottom:1px solid #f0f0f0;">${item.quantity || 1}</td>
              <td align="right" style="font-size:14px;color:#111;font-weight:600;padding:10px 0;border-bottom:1px solid #f0f0f0;">${fmt(item.total_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          <td style="font-size:14px;color:#555;">Total</td>
          <td align="right" style="font-size:18px;font-weight:700;color:#111;">${fmt(estimate?.total_amount)}</td>
        </tr>
      </table>`
    : estimate
      ? `<p style="font-size:18px;font-weight:700;color:#111;margin:0;">Total: ${fmt(estimate.total_amount)}</p>`
      : ''

  const paymentsHtml = payments?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr>
          <td colspan="2" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;padding-bottom:10px;">Payments received</td>
        </tr>
        ${payments.map((p) => `
          <tr>
            <td style="font-size:14px;color:#555;padding:6px 0;border-bottom:1px solid #f0f0f0;">${p.kind?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Payment'}</td>
            <td align="right" style="font-size:14px;font-weight:600;color:#111;padding:6px 0;border-bottom:1px solid #f0f0f0;">${fmt(p.amount)}</td>
          </tr>
        `).join('')}
      </table>`
    : ''

  return emailWrapper(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#111;letter-spacing:-0.02em;">Receipt</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;">Hi ${firstName}, here is your receipt from ${org.name}.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tr><td>
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Device</p>
        <p style="margin:0 0 12px;font-size:15px;color:#111;font-weight:600;">${device}${repairType ? ` · ${repairType}` : ''}</p>
        ${order?.order_number ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Order number</p>
        <p style="margin:0;font-size:14px;color:#111;font-family:monospace;">#${order.order_number}</p>` : `
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Quote ID</p>
        <p style="margin:0;font-size:13px;color:#111;font-family:monospace;">${quote.quote_id}</p>`}
      </td></tr>
    </table>

    ${lineItemsHtml}
    ${paymentsHtml}

    <p style="margin:24px 0 0;font-size:13px;color:#999;">Thank you for choosing ${org.name}.</p>
  `)
}

export async function sendAppointmentConfirmationEmail({ to, orgName, firstName, preferredAt, device, repairDescription }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set – skipping appointment confirmation email')
    return
  }

  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(preferredAt))

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Appointment request received – ${orgName}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#111;letter-spacing:-0.02em;">Appointment Request Received</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#555;">Hi ${esc(firstName)}, we've received your appointment request and will confirm it shortly.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Requested time</p>
          <p style="margin:0 0 12px;font-size:15px;color:#111;font-weight:600;">${esc(dateStr)}</p>
          ${device ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Device</p>
          <p style="margin:0 0 12px;font-size:15px;color:#111;">${esc(device)}</p>` : ''}
          ${repairDescription ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#999;">Issue described</p>
          <p style="margin:0;font-size:14px;color:#555;">${esc(repairDescription)}</p>` : ''}
        </td></tr>
      </table>

      <p style="margin:0 0 8px;font-size:14px;color:#555;">We'll send you a confirmation once your appointment is approved. If you have any questions, just reply to this email.</p>
      <p style="margin:24px 0 0;font-size:13px;color:#999;">— ${esc(orgName)}</p>
    `, `You received this because you submitted an appointment request to ${esc(orgName)}.`),
  })
}

export async function sendFeedbackEmail({ to, type, message, email, pageUrl }) {
  if (!resend) return
  const TYPE_LABELS = { bug: 'Bug report', feature: 'Feature request', general: 'General feedback' }
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[Feedback] ${TYPE_LABELS[type] || type}`,
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2 style="margin:0 0 16px">${TYPE_LABELS[type] || type}</h2>
      <p style="white-space:pre-wrap;background:#f8f8f8;padding:16px;border-radius:6px;font-size:14px">${esc(message)}</p>
      ${email ? `<p style="font-size:13px;color:#555">From: ${esc(email)}</p>` : ''}
      ${pageUrl ? `<p style="font-size:13px;color:#555">Page: ${esc(pageUrl)}</p>` : ''}
    </div>`,
  })
}

