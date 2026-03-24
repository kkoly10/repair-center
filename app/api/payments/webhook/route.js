import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 })
  }

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true })
  }

  const paymentIntent = event.data.object
  const { quoteRequestId, estimateId, depositAmount } = paymentIntent.metadata || {}

  if (!quoteRequestId) {
    return NextResponse.json({ received: true })
  }

  try {
    await finalizeDepositPayment({
      quoteRequestId,
      estimateId,
      depositAmount: Number(depositAmount || 0),
      paymentIntentId: paymentIntent.id,
    })
  } catch (err) {
    console.error('[webhook] Error processing payment_intent.succeeded:', err)
  }

  return NextResponse.json({ received: true })
}

export async function finalizeDepositPayment({ quoteRequestId, estimateId, depositAmount, paymentIntentId }) {
  const supabase = getSupabaseAdmin()

  // Idempotency: skip if repair order already exists
  const { data: existingOrder } = await supabase
    .from('repair_orders')
    .select('id, order_number')
    .eq('quote_request_id', quoteRequestId)
    .maybeSingle()

  if (existingOrder) {
    // Record payment if not already present
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (!existingPayment) {
      await supabase.from('payments').insert({
        repair_order_id: existingOrder.id,
        quote_estimate_id: estimateId || null,
        payment_kind: 'inspection_deposit',
        provider: 'stripe',
        provider_payment_intent_id: paymentIntentId,
        amount: depositAmount,
        currency: 'USD',
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
    }

    return { orderId: existingOrder.id, orderNumber: existingOrder.order_number, existing: true }
  }

  // Fetch quote request to build repair order
  const { data: quoteRequest, error: quoteError } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', quoteRequestId)
    .maybeSingle()

  if (quoteError) throw quoteError
  if (!quoteRequest) throw new Error(`Quote request not found: ${quoteRequestId}`)

  const [modelResult, repairTypeResult] = await Promise.all([
    quoteRequest.model_key
      ? supabase.from('repair_catalog_models').select('id').eq('model_key', quoteRequest.model_key).maybeSingle()
      : Promise.resolve({ data: null }),
    quoteRequest.repair_type_key
      ? supabase.from('repair_types').select('id').eq('repair_key', quoteRequest.repair_type_key).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const { data: newOrder, error: orderError } = await supabase
    .from('repair_orders')
    .insert({
      quote_request_id: quoteRequestId,
      customer_id: quoteRequest.customer_id,
      model_id: modelResult.data?.id || null,
      repair_type_id: repairTypeResult.data?.id || null,
      current_status: 'awaiting_mail_in',
      inspection_deposit_required: depositAmount,
      final_estimate_id: estimateId || null,
    })
    .select('id, order_number')
    .single()

  if (orderError) throw orderError

  // Record the payment
  await supabase.from('payments').insert({
    repair_order_id: newOrder.id,
    quote_estimate_id: estimateId || null,
    payment_kind: 'inspection_deposit',
    provider: 'stripe',
    provider_payment_intent_id: paymentIntentId,
    amount: depositAmount,
    currency: 'USD',
    status: 'paid',
    paid_at: new Date().toISOString(),
  })

  // Mark estimate as approved
  if (estimateId) {
    await supabase
      .from('quote_estimates')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', estimateId)
  }

  // Update quote request status
  await supabase
    .from('quote_requests')
    .update({ status: 'approved_for_mail_in', reviewed_at: new Date().toISOString() })
    .eq('id', quoteRequestId)

  return { orderId: newOrder.id, orderNumber: newOrder.order_number, existing: false }
}
