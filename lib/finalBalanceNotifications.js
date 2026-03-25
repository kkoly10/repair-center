import { Resend } from 'resend'
import { getQuoteNotificationContext } from './notifications'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@example.com'
const EMAIL_ENABLED = process.env.NOTIFICATIONS_EMAIL_ENABLED !== 'false'

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmt(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

async function insertNotificationLog({ supabase, dedupeKey, quoteRequestId, repairOrderId, recipientEmail, subject, payload }) {
  try {
    if (dedupeKey) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id, status')
        .eq('dedupe_key', dedupeKey)
        .maybeSingle()

      if (existing) return { id: existing.id, duplicate: true }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        event_key: 'final_balance_requested',
        channel: 'email',
        quote_request_id: quoteRequestId,
        repair_order_id: repairOrderId,
        recipient_email: recipientEmail,
        subject,
        status: 'queued',
        provider: 'resend',
        dedupe_key: dedupeKey,
        payload,
      })
      .select('id')
      .single()

    if (error) throw error
    return { id: data.id, duplicate: false }
  } catch (error) {
    console.error('[final-balance] log insert failed:', error)
    return null
  }
}

async function updateNotificationLog(supabase, notificationId, updates) {
  if (!notificationId) return
  try {
    await supabase.from('notifications').update(updates).eq('id', notificationId)
  } catch (error) {
    console.error('[final-balance] log update failed:', error)
  }
}

export async function sendFinalBalanceReadyNotification({ supabase, quoteRequestId, repairOrderId, amountDue, orderNumber }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  if (!context.recipientEmail) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const subject = orderNumber
    ? `Final balance due – Order #${orderNumber}`
    : `Final balance due – Quote #${context.quoteRequest.quote_id}`

  const dedupeKey = `final-balance-requested:${repairOrderId}:${amountDue}`
  const log = await insertNotificationLog({
    supabase,
    dedupeKey,
    quoteRequestId,
    repairOrderId,
    recipientEmail: context.recipientEmail,
    subject,
    payload: {
      quoteId: context.quoteRequest.quote_id,
      repairOrderId,
      orderNumber,
      amountDue,
    },
  })

  if (log?.duplicate) {
    return { ok: true, skipped: true, reason: 'duplicate' }
  }

  if (!EMAIL_ENABLED || !resend || !process.env.RESEND_API_KEY) {
    await updateNotificationLog(supabase, log?.id, {
      status: 'skipped',
      error_message: 'Email notifications disabled or missing RESEND_API_KEY.',
    })
    return { ok: false, skipped: true, reason: 'email-disabled' }
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  const payUrl = `${baseUrl}/pay/${context.quoteRequest.quote_id}/balance`
  const trackingUrl = `${baseUrl}/track/${context.quoteRequest.quote_id}`

  const html = `<!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="padding:24px 28px;background:#111827;color:#fff;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1;">Repair Center</div>
          <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;">Final balance ready</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#e5e7eb;">Hi ${esc(context.firstName)}, your repair is ready for final payment.</p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">Your remaining balance is <strong>${esc(fmt(amountDue))}</strong>.</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">Order number: ${esc(orderNumber || context.repairOrder?.order_number || 'Pending')}</p>
          <a href="${payUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:999px;font-weight:700;">Pay Final Balance</a>
          <div style="height:12px"></div>
          <a href="${trackingUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:999px;font-weight:700;">Open Tracking Page</a>
        </div>
      </div>
    </body>
  </html>`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: context.recipientEmail,
      subject,
      html,
    })

    await updateNotificationLog(supabase, log?.id, {
      status: 'sent',
      provider_message_id: result?.data?.id || null,
      sent_at: new Date().toISOString(),
    })

    return { ok: true, skipped: false }
  } catch (error) {
    await updateNotificationLog(supabase, log?.id, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown send error',
    })
    console.error('[final-balance] send failed:', error)
    return { ok: false, skipped: false, reason: 'send-failed' }
  }
}
