import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionContext } from '../../../../../../lib/admin/getSessionOrgId'
import { reportError } from '../../../../../../lib/observability'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request, context) {
  let session
  try {
    session = await getSessionContext()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const { orgId, userId } = session
  const supabase = getSupabaseAdmin()

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const params = await context.params
  const quoteId = params?.quoteId
  if (!quoteId) {
    return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
  }

  const paymentId = (body?.paymentId || '').toString().trim()
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing paymentId.' }, { status: 400 })
  }

  const rawReason = body?.reason
  const reason = typeof rawReason === 'string' ? rawReason.trim().slice(0, 200) : ''

  try {
    // Resolve quote (org-scoped) — gives us quote_request_id for lookups
    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
    }

    // Fetch the repair order so we can scope the payment search through it
    // (payments table has repair_order_id but no quote_request_id column).
    const { data: repairOrder, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('quote_request_id', quoteRequest.id)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!repairOrder) {
      return NextResponse.json({ error: 'Repair order not found for this quote.' }, { status: 404 })
    }

    // Fetch the payment row, scoped to the same org AND the same order.
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, organization_id, repair_order_id, payment_kind, provider, provider_payment_intent_id, amount, status')
      .eq('id', paymentId)
      .eq('organization_id', orgId)
      .eq('repair_order_id', repairOrder.id)
      .maybeSingle()

    if (paymentError) throw paymentError
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
    }

    if (payment.status !== 'paid') {
      return NextResponse.json({ error: 'Only paid payments can be refunded.' }, { status: 400 })
    }
    if (payment.payment_kind === 'refund') {
      return NextResponse.json({ error: 'Cannot refund a refund.' }, { status: 400 })
    }
    if (payment.provider !== 'stripe' || !payment.provider_payment_intent_id) {
      return NextResponse.json(
        { error: 'This payment was not made via Stripe and must be refunded manually.' },
        { status: 400 }
      )
    }

    const paymentAmountDollars = Number(payment.amount) || 0
    const paymentAmountCents = Math.round(paymentAmountDollars * 100)

    const rawRequestedCents = body?.amountCents
    let amountCents = paymentAmountCents
    if (rawRequestedCents !== undefined && rawRequestedCents !== null && rawRequestedCents !== '') {
      const parsed = Number(rawRequestedCents)
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        return NextResponse.json({ error: 'amountCents must be a whole number.' }, { status: 400 })
      }
      amountCents = parsed
    }

    if (amountCents <= 0) {
      return NextResponse.json({ error: 'Refund amount must be greater than zero.' }, { status: 400 })
    }
    if (amountCents > paymentAmountCents) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed the original payment amount.' },
        { status: 400 }
      )
    }

    // Look up Connect — if present, reverse the transfer so platform fee is
    // returned proportionally to the connected account.
    const { data: paymentSettings, error: settingsError } = await supabase
      .from('organization_payment_settings')
      .select('stripe_connect_account_id')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (settingsError) throw settingsError
    const isConnect = !!paymentSettings?.stripe_connect_account_id

    const stripe = getStripe()

    let refund
    try {
      refund = await stripe.refunds.create({
        payment_intent: payment.provider_payment_intent_id,
        amount: amountCents,
        reason: 'requested_by_customer',
        ...(isConnect && { reverse_transfer: true }),
      })
    } catch (stripeError) {
      reportError(stripeError, {
        area: 'admin-refund',
        quoteRequestId: quoteRequest.id,
        paymentId,
      })
      return NextResponse.json(
        { error: 'The payment provider rejected the refund. Please try again or process it manually in Stripe.' },
        { status: 502 }
      )
    }

    const refundDollars = amountCents / 100
    const noteParts = []
    if (reason) noteParts.push(`Reason: ${reason}`)
    noteParts.push(`Refund of payment ${paymentId}`)
    noteParts.push(`Initiated by ${userId}`)
    const note = noteParts.join(' · ').slice(0, 500)

    const nowIso = new Date().toISOString()
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        organization_id: orgId,
        repair_order_id: repairOrder.id,
        payment_kind: 'refund',
        provider: 'stripe',
        provider_payment_intent_id: refund.id,
        // amount column is dollars (numeric(10,2)); refunds are stored as a
        // negative number so net = sum(amount).
        amount: -refundDollars,
        currency: 'USD',
        status: 'paid',
        paid_at: nowIso,
        note,
      })

    if (insertError) {
      reportError(insertError, {
        area: 'admin-refund',
        quoteRequestId: quoteRequest.id,
        paymentId,
        refundId: refund.id,
        stage: 'payments-insert',
      })
      // Refund already went through at Stripe — surface this clearly so the
      // operator knows to reconcile manually.
      return NextResponse.json(
        {
          ok: false,
          refundId: refund.id,
          amountCents,
          error: 'Refund succeeded at Stripe but the local record could not be saved. Reconcile manually.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, refundId: refund.id, amountCents })
  } catch (error) {
    reportError(error, { area: 'admin-refund', quoteId, paymentId })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to issue refund.' },
      { status: 500 }
    )
  }
}
