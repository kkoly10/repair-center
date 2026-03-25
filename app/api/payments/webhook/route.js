import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import {
  sendDepositPaidNotification,
  sendMailInReadyNotification,
} from '../../../../lib/notifications'
import { finalizeFinalBalancePayment } from '../../../../lib/payments/finalizeFinalBalancePayment'

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
  const metadata = paymentIntent.metadata || {}
  const paymentKind = metadata.paymentKind || 'inspection_deposit'

  try {
    if (paymentKind === 'final_balance') {
      const quoteRequestId = metadata.quoteRequestId
      const repairOrderId = metadata.repairOrderId
      const estimateId = metadata.estimateId
      const finalBalanceAmount = Number(metadata.finalBalanceAmount || 0)

      if (!quoteRequestId) {
        return NextResponse.json({ received: true })
      }

      await finalizeFinalBalancePayment({
        quoteRequestId,
        repairOrderId,
        estimateId,
        paymentIntentId: paymentIntent.id,
        amount: finalBalanceAmount,
      })

      return NextResponse.json({ received: true })
    }

    const { quoteRequestId, estimateId, depositAmount } = metadata

    if (!quoteRequestId) {
      return NextResponse.json({ received: true })
    }

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

export async function finalizeDepositPayment({
  quoteRequestId,
  estimateId,
  depositAmount,
  paymentIntentId,
}) {
  const supabase = getSupabaseAdmin()

  const { data: quoteRequest, error: quoteError } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', quoteRequestId)
    .maybeSingle()

  if (quoteError) throw quoteError
  if (!quoteRequest) throw new Error(`Quote request not found: ${quoteRequestId}`)

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from('repair_orders')
    .select('id, order_number')
    .eq('quote_request_id', quoteRequestId)
    .maybeSingle()

  if (existingOrderError) throw existingOrderError

  let repairOrder = existingOrder
  let paymentRecord = null

  if (repairOrder) {
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from('payments')
      .select('id')
      .eq('provider_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (existingPaymentError) throw existingPaymentError

    if (existingPayment) {
      paymentRecord = existingPayment
    } else {
      const { data: insertedPayment, error: insertPaymentError } = await supabase
        .from('payments')
        .insert({
          repair_order_id: repairOrder.id,
          quote_estimate_id: estimateId || null,
          payment_kind: 'inspection_deposit',
          provider: 'stripe',
          provider_payment_intent_id: paymentIntentId,
          amount: depositAmount,
          currency: 'USD',
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertPaymentError) throw insertPaymentError
      paymentRecord = insertedPayment
    }
  } else {
    const [modelResult, repairTypeResult] = await Promise.all([
      quoteRequest.model_key
        ? supabase
            .from('repair_catalog_models')
            .select('id')
            .eq('model_key', quoteRequest.model_key)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      quoteRequest.repair_type_key
        ? supabase
            .from('repair_types')
            .select('id')
            .eq('repair_key', quoteRequest.repair_type_key)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    if (modelResult.error) throw modelResult.error
    if (repairTypeResult.error) throw repairTypeResult.error

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
    repairOrder = newOrder

    const { data: insertedPayment, error: insertPaymentError } = await supabase
      .from('payments')
      .insert({
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
      .select('id')
      .single()

    if (insertPaymentError) throw insertPaymentError
    paymentRecord = insertedPayment
  }

  if (estimateId) {
    const { error: estimateUpdateError } = await supabase
      .from('quote_estimates')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', estimateId)

    if (estimateUpdateError) throw estimateUpdateError
  }

  const { error: quoteUpdateError } = await supabase
    .from('quote_requests')
    .update({
      status: 'approved_for_mail_in',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', quoteRequestId)

  if (quoteUpdateError) throw quoteUpdateError

  try {
    await sendDepositPaidNotification({
      supabase,
      quoteRequestId,
      repairOrderId: repairOrder.id,
      paymentId: paymentRecord?.id || null,
      paymentIntentId,
      depositAmount,
      orderNumber: repairOrder.order_number || null,
    })

    await sendMailInReadyNotification({
      supabase,
      quoteRequestId,
      repairOrderId: repairOrder.id,
      estimateId: estimateId || null,
      orderNumber: repairOrder.order_number || null,
    })
  } catch (notificationError) {
    console.error('[payments] notification failure after deposit payment:', notificationError)
  }

  return {
    orderId: repairOrder.id,
    orderNumber: repairOrder.order_number,
    existing: Boolean(existingOrder),
  }
}