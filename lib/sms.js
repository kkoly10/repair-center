import { getQuoteNotificationContext } from './notifications'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const SMS_ENABLED = process.env.NOTIFICATIONS_SMS_ENABLED === 'true'

function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null
  // Use fetch-based Twilio API (no SDK dependency needed)
  return {
    async sendSMS(to, body) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'SMS send failed')
      }
      return response.json()
    }
  }
}

async function insertSMSLog({ supabase, eventKey, dedupeKey, organizationId, quoteRequestId, repairOrderId, recipientPhone, body }) {
  if (!supabase) return null
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
        event_key: eventKey,
        channel: 'sms',
        organization_id: organizationId || null,
        quote_request_id: quoteRequestId || null,
        repair_order_id: repairOrderId || null,
        recipient_email: recipientPhone, // reuse field for phone
        subject: body.substring(0, 100),
        status: 'queued',
        provider: 'twilio',
        dedupe_key: dedupeKey || null,
        payload: { body },
      })
      .select('id')
      .single()
    if (error) throw error
    return { id: data.id, duplicate: false }
  } catch (err) {
    console.error('[sms] log insert failed:', err)
    return null
  }
}

async function updateSMSLog(supabase, notificationId, updates) {
  if (!supabase || !notificationId) return
  try {
    await supabase.from('notifications').update(updates).eq('id', notificationId)
  } catch (err) {
    console.error('[sms] log update failed:', err)
  }
}

async function sendSMS({ supabase, eventKey, dedupeKey, organizationId, quoteRequestId, repairOrderId, to, body }) {
  if (!to) return { ok: false, skipped: true, reason: 'missing-phone' }

  const log = await insertSMSLog({
    supabase,
    eventKey,
    dedupeKey,
    organizationId,
    quoteRequestId,
    repairOrderId,
    recipientPhone: to,
    body,
  })

  if (log?.duplicate) {
    return { ok: true, skipped: true, reason: 'duplicate', notificationId: log.id }
  }

  if (!SMS_ENABLED) {
    await updateSMSLog(supabase, log?.id, {
      status: 'skipped',
      error_message: 'SMS notifications disabled.',
    })
    return { ok: false, skipped: true, reason: 'sms-disabled' }
  }

  const client = getTwilioClient()
  if (!client) {
    await updateSMSLog(supabase, log?.id, {
      status: 'skipped',
      error_message: 'Missing Twilio credentials.',
    })
    return { ok: false, skipped: true, reason: 'missing-twilio-credentials' }
  }

  try {
    const result = await client.sendSMS(to, body)

    await updateSMSLog(supabase, log?.id, {
      status: 'sent',
      provider_message_id: result?.sid || null,
      sent_at: new Date().toISOString(),
    })

    return { ok: true, skipped: false, notificationId: log?.id }
  } catch (err) {
    await updateSMSLog(supabase, log?.id, {
      status: 'failed',
      error_message: err instanceof Error ? err.message : 'Unknown SMS error',
    })
    console.error(`[sms] ${eventKey} send failed:`, err)
    return { ok: false, skipped: false, reason: 'send-failed' }
  }
}

export async function sendEstimateSMS({ supabase, quoteRequestId, estimateId, totalAmount }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  const phone = context.quoteRequest.guest_phone
  if (!phone) return { ok: false, skipped: true, reason: 'missing-phone' }

  const device = context.deviceDescription || 'your device'
  const brand = context.orgName || 'Repair Center'
  const body = `Hi ${context.firstName}, your repair estimate for ${device} is ready! Review it here: ${context.reviewUrl} - ${brand}`

  return sendSMS({
    supabase,
    eventKey: 'estimate_sent_sms',
    dedupeKey: `sms:estimate-ready:${estimateId}`,
    organizationId: context.quoteRequest.organization_id,
    quoteRequestId,
    repairOrderId: context.repairOrder?.id || null,
    to: phone,
    body,
  })
}

export async function sendDepositConfirmSMS({ supabase, quoteRequestId, repairOrderId, paymentIntentId, depositAmount }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  const phone = context.quoteRequest.guest_phone
  if (!phone) return { ok: false, skipped: true, reason: 'missing-phone' }

  const device = context.deviceDescription || 'your device'
  const amount = Number(depositAmount || 0).toFixed(2)
  const brand = context.orgName || 'Repair Center'
  const body = `Hi ${context.firstName}, your $${amount} deposit for ${device} repair has been received. View mail-in instructions: ${context.mailInUrl} - ${brand}`

  return sendSMS({
    supabase,
    eventKey: 'deposit_paid_sms',
    dedupeKey: `sms:deposit-paid:${paymentIntentId}`,
    organizationId: context.quoteRequest.organization_id,
    quoteRequestId,
    repairOrderId: repairOrderId || context.repairOrder?.id || null,
    to: phone,
    body,
  })
}

export async function sendRepairStatusSMS({ supabase, quoteRequestId, repairOrderId, historyId, status }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  const phone = context.quoteRequest.guest_phone
  if (!phone) return { ok: false, skipped: true, reason: 'missing-phone' }

  const statusText = String(status || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  const brand = context.orgName || 'Repair Center'
  const body = `Hi ${context.firstName}, your repair status has been updated to: ${statusText}. Track progress: ${context.trackingUrl} - ${brand}`

  return sendSMS({
    supabase,
    eventKey: 'repair_status_updated_sms',
    dedupeKey: `sms:repair-status:${historyId}`,
    organizationId: context.quoteRequest.organization_id,
    quoteRequestId,
    repairOrderId: repairOrderId || context.repairOrder?.id || null,
    to: phone,
    body,
  })
}

export async function sendShipmentSMS({ supabase, quoteRequestId, repairOrderId, shipmentId, trackingNumber }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  const phone = context.quoteRequest.guest_phone
  if (!phone) return { ok: false, skipped: true, reason: 'missing-phone' }

  const device = context.deviceDescription || 'your device'
  const brand = context.orgName || 'Repair Center'
  const body = `Hi ${context.firstName}, your repaired ${device} has shipped! Tracking: ${trackingNumber || 'pending'}. Track: ${context.trackingUrl} - ${brand}`

  return sendSMS({
    supabase,
    eventKey: 'shipment_updated_sms',
    dedupeKey: `sms:shipment:${shipmentId}:${trackingNumber || 'no-tracking'}`,
    organizationId: context.quoteRequest.organization_id,
    quoteRequestId,
    repairOrderId: repairOrderId || context.repairOrder?.id || null,
    to: phone,
    body,
  })
}

export async function sendFinalBalanceSMS({ supabase, quoteRequestId, repairOrderId, amountDue }) {
  const context = await getQuoteNotificationContext(supabase, quoteRequestId)
  const phone = context.quoteRequest.guest_phone
  if (!phone) return { ok: false, skipped: true, reason: 'missing-phone' }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  const payUrl = `${baseUrl}/pay/${context.quoteRequest.quote_id}/balance`
  const amount = Number(amountDue || 0).toFixed(2)
  const brand = context.orgName || 'Repair Center'
  const body = `Hi ${context.firstName}, your repair is complete! Final balance of $${amount} is due. Pay here: ${payUrl} - ${brand}`

  return sendSMS({
    supabase,
    eventKey: 'final_balance_requested_sms',
    dedupeKey: `sms:final-balance:${repairOrderId}:${amountDue}`,
    organizationId: context.quoteRequest.organization_id,
    quoteRequestId,
    repairOrderId: repairOrderId || context.repairOrder?.id || null,
    to: phone,
    body,
  })
}
