import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getConnectParams } from '../../../../lib/payments/getConnectParams'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request) {
  const supabase = getSupabaseAdmin()

  try {
    const body = await request.json()
    const quoteId = (body?.quoteId || '').toString().trim()
    const email = (body?.email || '').toString().trim().toLowerCase()

    if (!quoteId || !email) {
      return NextResponse.json({ error: 'Quote ID and email are required.' }, { status: 400 })
    }

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('quote_id', quoteId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
    }

    const customerResult = quoteRequest.customer_id
      ? await supabase
          .from('customers')
          .select('email')
          .eq('id', quoteRequest.customer_id)
          .maybeSingle()
      : { data: null, error: null }

    if (customerResult.error) throw customerResult.error

    const allowedEmails = [quoteRequest.guest_email, customerResult.data?.email]
      .filter(Boolean)
      .map((value) => value.toLowerCase())

    if (!allowedEmails.includes(email)) {
      return NextResponse.json({ error: 'Email does not match this quote.' }, { status: 403 })
    }

    const { data: repairOrder, error: repairOrderError } = await supabase
      .from('repair_orders')
      .select('id, order_number, current_status, final_estimate_id')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (repairOrderError) throw repairOrderError
    if (!repairOrder) {
      return NextResponse.json({ error: 'Repair order not found.' }, { status: 404 })
    }

    const { data: latestEstimate, error: estimateError } = await supabase
      .from('quote_estimates')
      .select('id, total_amount, status')
      .eq('quote_request_id', quoteRequest.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (estimateError) throw estimateError
    if (!latestEstimate) {
      return NextResponse.json({ error: 'Estimate not found for this repair.' }, { status: 404 })
    }

    const { data: paidPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, payment_kind, status')
      .eq('repair_order_id', repairOrder.id)
      .eq('status', 'paid')

    if (paymentsError) throw paymentsError

    const totalPaid = (paidPayments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    )

    const finalBalanceDue = Math.max(Number(latestEstimate.total_amount || 0) - totalPaid, 0)

    if (finalBalanceDue <= 0) {
      return NextResponse.json({ error: 'No balance is due for this repair.' }, { status: 400 })
    }

    if (!['awaiting_balance_payment', 'ready_to_ship'].includes(repairOrder.current_status)) {
      return NextResponse.json(
        { error: 'Final balance payment is not currently available for this repair.' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    const connectParams = await getConnectParams(supabase, quoteRequest.organization_id)
    const amountCents = Math.round(finalBalanceDue * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      receipt_email: email,
      description: `Repair balance – ${[quoteRequest.brand_name, quoteRequest.model_name]
        .filter(Boolean)
        .join(' ')} ${quoteRequest.repair_type_key || ''}`.trim(),
      metadata: {
        quoteId: quoteRequest.quote_id,
        quoteRequestId: quoteRequest.id,
        repairOrderId: repairOrder.id,
        estimateId: latestEstimate.id,
        paymentKind: 'final_balance',
        finalBalanceAmount: String(finalBalanceDue),
      },
      ...(connectParams && {
        transfer_data: { destination: connectParams.destination },
        application_fee_amount: Math.max(1, Math.round(amountCents * connectParams.feePercent)),
      }),
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      finalBalanceDue,
      summary: {
        orderNumber: repairOrder.order_number,
        device: [quoteRequest.brand_name, quoteRequest.model_name].filter(Boolean).join(' '),
        repair: quoteRequest.repair_type_key || '',
        estimateTotal: latestEstimate.total_amount,
        totalPaid,
        quoteId,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to create final balance payment.',
      },
      { status: 500 }
    )
  }
}