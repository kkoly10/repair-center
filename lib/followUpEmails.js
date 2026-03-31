import { Resend } from 'resend'
import { getQuoteNotificationContext } from './notifications'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@example.com'
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL_ENABLED = process.env.NOTIFICATIONS_EMAIL_ENABLED !== 'false'

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

async function insertNotificationLog({ supabase, eventKey, dedupeKey, quoteRequestId, repairOrderId, recipientEmail, subject, payload }) {
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
    console.error('[follow-up] log insert failed:', error)
    return null
  }
}

async function updateNotificationLog(supabase, notificationId, updates) {
  if (!supabase || !notificationId) return
  try {
    await supabase.from('notifications').update(updates).eq('id', notificationId)
  } catch (error) {
    console.error('[follow-up] log update failed:', error)
  }
}

async function sendFollowUpEmail({ supabase, eventKey, dedupeKey, quoteRequestId, repairOrderId, to, subject, html, payload }) {
  if (!to) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const log = await insertNotificationLog({
    supabase,
    eventKey,
    dedupeKey,
    quoteRequestId,
    repairOrderId,
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
    console.error(`[follow-up] ${eventKey} send failed:`, error)
    return { ok: false, skipped: false, reason: 'send-failed' }
  }
}

export async function sendReviewRequestEmail({ supabase, quoteRequestId, repairOrderId }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const quoteId = context.quoteRequest.quote_id
  const subject = `How was your repair? – Quote #${quoteId}`

  const stars = [1, 2, 3, 4, 5]
    .map((rating) => {
      const url = `${BASE_URL}/review/${quoteId}?rating=${rating}`
      const star = rating <= 3 ? '\u2606' : '\u2605'
      return `<a href="${url}" style="text-decoration:none;font-size:32px;margin:0 4px;color:${rating <= 3 ? '#d1d5db' : '#f59e0b'};">${star}</a>`
    })
    .join('')

  const html = wrapEmail({
    title: 'How was your repair?',
    intro: `Hi ${context.firstName}, we hope you're enjoying your repaired ${context.deviceDescription || 'device'}!`,
    body: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        We'd love to hear about your experience. Tap a star to leave a quick review:
      </p>
      <div style="text-align:center;margin:24px 0;">
        ${stars}
      </div>
      <p style="text-align:center;margin:0 0 16px;font-size:13px;color:#6b7280;">
        Click a star to rate your experience
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        Thank you for choosing Repair Center. Your feedback helps us improve!
      </p>
    `,
  })

  return sendFollowUpEmail({
    supabase,
    eventKey: 'review_request',
    dedupeKey: `review-request:${quoteRequestId}`,
    quoteRequestId,
    repairOrderId,
    to: context.recipientEmail,
    subject,
    html,
    payload: { quoteId, deviceDescription: context.deviceDescription },
  })
}

export async function sendWarrantyReminderEmail({ supabase, quoteRequestId, repairOrderId, warrantyDays }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const quoteId = context.quoteRequest.quote_id

  // Calculate warranty expiration date from the repair order or quote request
  const createdAt = context.repairOrder?.created_at || context.quoteRequest.created_at
  const expirationDate = new Date(new Date(createdAt).getTime() + (warrantyDays || 90) * 24 * 60 * 60 * 1000)
  const formattedDate = expirationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const subject = `Your warranty expires soon – Quote #${quoteId}`

  const html = wrapEmail({
    title: 'Warranty Expiration Reminder',
    intro: `Hi ${context.firstName}, this is a friendly reminder about your repair warranty.`,
    body: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Your <strong>${warrantyDays || 90}-day warranty</strong> for the repair of your
        <strong>${esc(context.deviceDescription || 'device')}</strong> expires on
        <strong>${esc(formattedDate)}</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        If you're experiencing any issues related to your original repair, please contact us
        before the warranty period ends so we can take care of it at no additional cost.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
        You can view your repair details and warranty information on your tracking page.
      </p>
      <a href="${context.trackingUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:999px;font-weight:700;">View Repair Details</a>
      <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
        ${esc(context.trackingUrl)}
      </p>
    `,
  })

  return sendFollowUpEmail({
    supabase,
    eventKey: 'warranty_reminder',
    dedupeKey: `warranty-reminder:${quoteRequestId}:${warrantyDays || 90}`,
    quoteRequestId,
    repairOrderId,
    to: context.recipientEmail,
    subject,
    html,
    payload: { quoteId, warrantyDays: warrantyDays || 90, expirationDate: expirationDate.toISOString() },
  })
}
