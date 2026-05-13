import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { sendReviewRequestEmail, sendWarrantyReminderEmail } from '../../../../lib/followUpEmails'

export const runtime = 'nodejs'

const REVIEW_DELAY_DAYS = 3
const WARRANTY_REMINDER_DAYS_BEFORE = 7

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()

  let reviewSent = 0
  let warrantySent = 0
  let skipped = 0
  const errors = []

  // Review requests: orders that shipped/delivered REVIEW_DELAY_DAYS days ago
  const reviewWindowStart = new Date(now)
  reviewWindowStart.setDate(reviewWindowStart.getDate() - (REVIEW_DELAY_DAYS + 1))
  const reviewWindowEnd = new Date(now)
  reviewWindowEnd.setDate(reviewWindowEnd.getDate() - REVIEW_DELAY_DAYS)

  const { data: reviewCandidates, error: reviewQueryError } = await supabase
    .from('repair_orders')
    .select('id, quote_request_id, organization_id')
    .in('current_status', ['shipped', 'delivered'])
    .gte('shipped_at', reviewWindowStart.toISOString())
    .lt('shipped_at', reviewWindowEnd.toISOString())

  if (reviewQueryError) {
    errors.push(`review query: ${reviewQueryError.message}`)
  } else {
    for (const order of reviewCandidates || []) {
      try {
        const result = await sendReviewRequestEmail({
          supabase,
          quoteRequestId: order.quote_request_id,
          repairOrderId: order.id,
        })
        if (result.skipped) {
          skipped++
        } else if (result.ok) {
          reviewSent++
        } else {
          errors.push(`review for order ${order.id}: ${result.reason}`)
        }
      } catch (err) {
        errors.push(`review for order ${order.id}: ${err.message}`)
      }
    }
  }

  // Warranty reminders: orders where warranty expires in WARRANTY_REMINDER_DAYS_BEFORE days
  // repair_completed_at + warranty_days = expiry date
  // We want: expiry date between (now + WARRANTY_REMINDER_DAYS_BEFORE - 1) and (now + WARRANTY_REMINDER_DAYS_BEFORE)
  const warrantyWindowStart = new Date(now)
  warrantyWindowStart.setDate(warrantyWindowStart.getDate() + WARRANTY_REMINDER_DAYS_BEFORE - 1)
  const warrantyWindowEnd = new Date(now)
  warrantyWindowEnd.setDate(warrantyWindowEnd.getDate() + WARRANTY_REMINDER_DAYS_BEFORE)

  // Fetch orders with warranty_days set and repair_completed_at set
  // Filter in JS since PostgREST can't do date arithmetic across columns
  const { data: warrantyCandidates, error: warrantyQueryError } = await supabase
    .from('repair_orders')
    .select('id, quote_request_id, organization_id, repair_completed_at, warranty_days')
    .not('repair_completed_at', 'is', null)
    .not('warranty_days', 'is', null)
    .gt('warranty_days', 0)
    .in('current_status', ['shipped', 'delivered'])

  if (warrantyQueryError) {
    errors.push(`warranty query: ${warrantyQueryError.message}`)
  } else {
    for (const order of warrantyCandidates || []) {
      const completedAt = new Date(order.repair_completed_at)
      const expiryDate = new Date(completedAt.getTime() + order.warranty_days * 24 * 60 * 60 * 1000)

      if (expiryDate < warrantyWindowStart || expiryDate >= warrantyWindowEnd) continue

      try {
        const result = await sendWarrantyReminderEmail({
          supabase,
          quoteRequestId: order.quote_request_id,
          repairOrderId: order.id,
          warrantyDays: order.warranty_days,
        })
        if (result.skipped) {
          skipped++
        } else if (result.ok) {
          warrantySent++
        } else {
          errors.push(`warranty for order ${order.id}: ${result.reason}`)
        }
      } catch (err) {
        errors.push(`warranty for order ${order.id}: ${err.message}`)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    reviewSent,
    warrantySent,
    skipped,
    errors,
  })
}
