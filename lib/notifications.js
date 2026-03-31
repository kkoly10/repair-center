import { Resend } from 'resend'
import { sendEstimateSMS, sendDepositConfirmSMS, sendRepairStatusSMS, sendShipmentSMS } from './sms'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@example.com'
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL_ENABLED = process.env.NOTIFICATIONS_EMAIL_ENABLED !== 'false'

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function formatStatus(status) {
  return String(status || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrapEmail({ title, intro, body }) {
  return `<!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="padding:24px 28px;background:#111827;color:#fff;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1;">Repair Center</div>
          <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;">${esc(title)}</h1>
          ${intro ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#e5e7eb;">${esc(intro)}</p>` : ''}
        </div>
        <div style="padding:28px;">${body}</div>
      </div>
    </body>
  </html>`
}

function button(url, label) {
  return `<a href="${url}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:999px;font-weight:700;">${esc(label)}</a>`
}

function detailTable(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">${rows
    .map(
      (row) => `<tr>
        <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;background:#f9fafb;font-size:12px;text-transform:uppercase;font-weight:700;color:#6b7280;width:34%;">${esc(row.label)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${row.value}</td>
      </tr>`
    )
    .join('')}</table>`
}

async function insertNotificationLog({ supabase, eventKey, dedupeKey, quoteRequestId, repairOrderId, paymentId, recipientEmail, subject, payload }) {
  if (!supabase) return null

  try {
    if (dedupeKey) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id, status')
        .eq('dedupe_key', dedupeKey)
        .maybeSingle()

      if (existing) return { id: existing.id, duplicate: true, status: existing.status }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        event_key: eventKey,
        channel: 'email',
        quote_request_id: quoteRequestId || null,
        repair_order_id: repairOrderId || null,
        payment_id: paymentId || null,
        recipient_email: recipientEmail,
        subject,
        status: 'queued',
        provider: 'resend',
        dedupe_key: dedupeKey || null,
        payload: payload || {},
      })
      .select('id')
      .single()

    if (error) throw error
    return { id: data.id, duplicate: false }
  } catch (error) {
    console.error('[notifications] log insert failed:', error)
    return null
  }
}

async function updateNotificationLog(supabase, notificationId, updates) {
  if (!supabase || !notificationId) return
  try {
    await supabase.from('notifications').update(updates).eq('id', notificationId)
  } catch (error) {
    console.error('[notifications] log update failed:', error)
  }
}

async function sendEmail({ supabase, eventKey, dedupeKey, quoteRequestId, repairOrderId, paymentId, to, subject, html, payload }) {
  if (!to) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const log = await insertNotificationLog({
    supabase,
    eventKey,
    dedupeKey,
    quoteRequestId,
    repairOrderId,
    paymentId,
    recipientEmail: to,
    subject,
    payload,
  })

  if (log?.duplicate) {
    return { ok: true, skipped: true, reason: 'duplicate', notificationId: log.id }
  }

  if (!EMAIL_ENABLED || !resend || !process.env.RESEND_API_KEY) {
    await updateNotificationLog(supabase, log?.id, {
      status: 'skipped',
      error_message: 'Email notifications disabled or missing RESEND_API_KEY.',
    })
    return { ok: false, skipped: true, reason: 'email-disabled' }
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    await updateNotificationLog(supabase, log?.id, {
      status: 'sent',
      provider_message_id: result?.data?.id || null,
      sent_at: new Date().toISOString(),
    })

    return { ok: true, skipped: false, notificationId: log?.id }
  } catch (error) {
    await updateNotificationLog(supabase, log?.id, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown send error',
    })
    console.error(`[notifications] ${eventKey} send failed:`, error)
    return { ok: false, skipped: false, reason: 'send-failed' }
  }
}

export async function getQuoteNotificationContext(supabase, quoteRequestId) {
  const { data: quoteRequest, error: quoteError } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', quoteRequestId)
    .maybeSingle()

  if (quoteError) throw quoteError
  if (!quoteRequest) throw new Error(`Quote request not found: ${quoteRequestId}`)

  const [customerResult, orderResult] = await Promise.all([
    quoteRequest.customer_id
      ? supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .eq('id', quoteRequest.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('repair_orders')
      .select('id, order_number, current_status')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle(),
  ])

  if (customerResult.error) throw customerResult.error
  if (orderResult.error) throw orderResult.error

  const recipientEmail = customerResult.data?.email || quoteRequest.guest_email || null
  const customerName = [
    customerResult.data?.first_name || quoteRequest.first_name,
    customerResult.data?.last_name || quoteRequest.last_name,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    quoteRequest,
    repairOrder: orderResult.data || null,
    recipientEmail,
    customerName,
    firstName: customerName ? customerName.split(' ')[0] : 'there',
    deviceDescription: [quoteRequest.brand_name, quoteRequest.model_name].filter(Boolean).join(' '),
    reviewUrl: `${BASE_URL}/estimate-review/${quoteRequest.quote_id}`,
    trackingUrl: `${BASE_URL}/track/${quoteRequest.quote_id}`,
    mailInUrl: `${BASE_URL}/mail-in/${quoteRequest.quote_id}`,
  }
}

export async function sendEstimateSentNotification({ supabase, quoteRequestId, estimateId, estimateKind, totalAmount }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const kindLabel = estimateKind === 'final' ? 'final estimate' : estimateKind === 'revised' ? 'updated estimate' : 'estimate'
  const subject =
    estimateKind === 'final'
      ? `Your final repair estimate is ready – Quote #${context.quoteRequest.quote_id}`
      : estimateKind === 'revised'
        ? `Your updated repair estimate is ready – Quote #${context.quoteRequest.quote_id}`
        : `Your repair estimate is ready – Quote #${context.quoteRequest.quote_id}`

  const html = wrapEmail({
    title: estimateKind === 'final' ? 'Your final estimate is ready' : estimateKind === 'revised' ? 'Your updated estimate is ready' : 'Your estimate is ready',
    intro: `Hi ${context.firstName}, your ${kindLabel} for ${context.deviceDescription || 'your device'} is ready to review.`,
    body: `${detailTable([
      { label: 'Quote ID', value: `<strong>${esc(context.quoteRequest.quote_id)}</strong>` },
      { label: 'Device', value: esc(context.deviceDescription || 'Your device') },
      { label: 'Estimate Total', value: `<strong>${esc(formatMoney(totalAmount))}</strong>` },
      { label: 'Estimate Type', value: esc(kindLabel) },
    ])}${button(context.reviewUrl, 'Review Estimate')}<p style="margin:16px 0 0;font-size:13px;color:#6b7280;">${esc(context.reviewUrl)}</p>`,
  })

  // Fire-and-forget SMS
  sendEstimateSMS({ supabase, quoteRequestId, estimateId, totalAmount }).catch((err) => {
    console.error('[notifications] SMS estimate failed:', err)
  })

  return sendEmail({
    supabase,
    eventKey: estimateKind === 'preliminary' ? 'estimate_sent' : 'estimate_revised_sent',
    dedupeKey: `estimate-ready:${estimateId}`,
    quoteRequestId,
    repairOrderId: context.repairOrder?.id || null,
    to: context.recipientEmail,
    subject,
    html,
    payload: { estimateId, estimateKind, totalAmount, quoteId: context.quoteRequest.quote_id },
  })
}

export async function sendMailInReadyNotification({ supabase, quoteRequestId, repairOrderId, estimateId, orderNumber }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const subject = orderNumber
    ? `Repair approved – next steps for Order #${orderNumber}`
    : `Repair approved – next steps for Quote #${context.quoteRequest.quote_id}`

  const html = wrapEmail({
    title: 'Your repair is approved',
    intro: `Hi ${context.firstName}, your repair request is approved and ready for mail-in.`,
    body: `${detailTable([
      { label: 'Quote ID', value: `<strong>${esc(context.quoteRequest.quote_id)}</strong>` },
      { label: 'Order Number', value: esc(orderNumber || context.repairOrder?.order_number || 'Assigned after intake') },
      { label: 'Device', value: esc(context.deviceDescription || 'Your device') },
    ])}${button(context.mailInUrl, 'View Mail-In Instructions')}<div style="height:12px"></div>${button(context.trackingUrl, 'Open Tracking Page')}`,
  })

  return sendEmail({
    supabase,
    eventKey: 'mail_in_ready',
    dedupeKey: `mail-in-ready:${estimateId || 'no-estimate'}:${repairOrderId || 'no-order'}`,
    quoteRequestId,
    repairOrderId,
    to: context.recipientEmail,
    subject,
    html,
    payload: { quoteId: context.quoteRequest.quote_id, estimateId, orderNumber },
  })
}

export async function sendDepositPaidNotification({ supabase, quoteRequestId, repairOrderId, paymentId, paymentIntentId, depositAmount, orderNumber }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const subject = orderNumber
    ? `Deposit received – Order #${orderNumber}`
    : `Deposit received – Quote #${context.quoteRequest.quote_id}`

  const html = wrapEmail({
    title: 'Your deposit has been received',
    intro: `Hi ${context.firstName}, we confirmed your inspection deposit payment.`,
    body: `${detailTable([
      { label: 'Quote ID', value: `<strong>${esc(context.quoteRequest.quote_id)}</strong>` },
      { label: 'Order Number', value: esc(orderNumber || context.repairOrder?.order_number || 'Assigned after intake') },
      { label: 'Deposit Paid', value: `<strong>${esc(formatMoney(depositAmount))}</strong>` },
    ])}${button(context.mailInUrl, 'View Mail-In Instructions')}<div style="height:12px"></div>${button(context.trackingUrl, 'Open Tracking Page')}`,
  })

  // Fire-and-forget SMS
  sendDepositConfirmSMS({ supabase, quoteRequestId, repairOrderId, paymentIntentId, depositAmount }).catch((err) => {
    console.error('[notifications] SMS deposit confirm failed:', err)
  })

  return sendEmail({
    supabase,
    eventKey: 'deposit_paid',
    dedupeKey: `deposit-paid:${paymentIntentId}`,
    quoteRequestId,
    repairOrderId,
    paymentId,
    to: context.recipientEmail,
    subject,
    html,
    payload: { quoteId: context.quoteRequest.quote_id, depositAmount, paymentIntentId },
  })
}

export async function sendRepairStatusNotification({ supabase, quoteRequestId, repairOrderId, historyId, status, note }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const statusText = formatStatus(status)
  const subject = `${statusText} update for ${context.deviceDescription || 'your repair'}`
  const html = wrapEmail({
    title: statusText,
    intro: `Hi ${context.firstName}, your repair status has been updated.`,
    body: `${detailTable([
      { label: 'Quote ID', value: `<strong>${esc(context.quoteRequest.quote_id)}</strong>` },
      { label: 'Order Number', value: esc(context.repairOrder?.order_number || 'Pending') },
      { label: 'Current Stage', value: `<strong>${esc(statusText)}</strong>` },
    ])}${note ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">${esc(note)}</p>` : ''}${button(context.trackingUrl, 'Open Tracking Page')}`,
  })

  // Fire-and-forget SMS
  sendRepairStatusSMS({ supabase, quoteRequestId, repairOrderId, historyId, status }).catch((err) => {
    console.error('[notifications] SMS repair status failed:', err)
  })

  return sendEmail({
    supabase,
    eventKey: 'repair_status_updated',
    dedupeKey: `repair-status:${historyId}`,
    quoteRequestId,
    repairOrderId,
    to: context.recipientEmail,
    subject,
    html,
    payload: { quoteId: context.quoteRequest.quote_id, status, note, historyId },
  })
}

export async function sendShipmentNotification({ supabase, quoteRequestId, repairOrderId, shipmentId, carrier, trackingNumber, trackingUrl }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const subject = context.repairOrder?.order_number
    ? `Your device has shipped – Order #${context.repairOrder.order_number}`
    : 'Your repaired device has shipped'

  const html = wrapEmail({
    title: 'Your repaired device is on its way',
    intro: `Hi ${context.firstName}, your device has shipped back to you.`,
    body: `${detailTable([
      { label: 'Order Number', value: esc(context.repairOrder?.order_number || 'Pending') },
      { label: 'Carrier', value: esc(carrier || 'Carrier pending') },
      { label: 'Tracking Number', value: esc(trackingNumber || 'Pending') },
    ])}${trackingUrl ? button(trackingUrl, 'Track Package') : ''}<div style="height:12px"></div>${button(context.trackingUrl, 'Open Repair Tracking')}`,
  })

  // Fire-and-forget SMS
  sendShipmentSMS({ supabase, quoteRequestId, repairOrderId, shipmentId, trackingNumber }).catch((err) => {
    console.error('[notifications] SMS shipment failed:', err)
  })

  return sendEmail({
    supabase,
    eventKey: 'shipment_updated',
    dedupeKey: `shipment:${shipmentId}:${trackingNumber || 'no-tracking'}:${trackingUrl || 'no-url'}`,
    quoteRequestId,
    repairOrderId,
    to: context.recipientEmail,
    subject,
    html,
    payload: { quoteId: context.quoteRequest.quote_id, shipmentId, carrier, trackingNumber, trackingUrl },
  })
}
