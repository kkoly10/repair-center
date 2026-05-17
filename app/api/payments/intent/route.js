import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getConnectParams } from '../../../../lib/payments/getConnectParams'
import { checkRateLimit } from '../../../../lib/rateLimiter'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed } = await checkRateLimit(ip, { maxRequests: 20, windowMs: 60 * 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
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

    // Verify email
    const customerResult = quoteRequest.customer_id
      ? await supabase.from('customers').select('email').eq('id', quoteRequest.customer_id).maybeSingle()
      : { data: null, error: null }

    if (customerResult.error) throw customerResult.error

    const allowedEmails = [quoteRequest.guest_email, customerResult.data?.email]
      .filter(Boolean)
      .map((e) => e.toLowerCase())

    if (!allowedEmails.includes(email)) {
      return NextResponse.json({ error: 'Email does not match this quote.' }, { status: 403 })
    }

    // Verify there's a sent (not yet approved) estimate
    const { data: estimate, error: estimateError } = await supabase
      .from('quote_estimates')
      .select('id, status, total_amount')
      .eq('quote_request_id', quoteRequest.id)
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (estimateError) throw estimateError
    if (!estimate) {
      return NextResponse.json({ error: 'No pending estimate found for this quote.' }, { status: 400 })
    }

    // Verify no repair order already exists
    const { data: existingOrder, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (orderError) throw orderError
    if (existingOrder) {
      return NextResponse.json({ error: 'A repair order already exists for this quote.' }, { status: 400 })
    }

    // Get deposit amount from pricing rule
    let depositAmount = 0
    if (quoteRequest.selected_pricing_rule_id) {
      const { data: pricingRule, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('deposit_amount')
        .eq('id', quoteRequest.selected_pricing_rule_id)
        .maybeSingle()

      if (pricingError) throw pricingError
      depositAmount = pricingRule?.deposit_amount || 0
    }

    if (!depositAmount || depositAmount <= 0) {
      return NextResponse.json({ error: 'No deposit is required for this repair.' }, { status: 400 })
    }

    const stripe = getStripe()

    const connectParams = await getConnectParams(supabase, quoteRequest.organization_id)
    const amountCents = Math.round(depositAmount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      receipt_email: email,
      description: `Repair deposit – ${[quoteRequest.brand_name, quoteRequest.model_name].filter(Boolean).join(' ')} ${quoteRequest.repair_type_key || ''}`.trim(),
      metadata: {
        organizationId: quoteRequest.organization_id,
        quoteId: quoteRequest.quote_id,
        quoteRequestId: quoteRequest.id,
        estimateId: estimate.id,
        depositAmount: String(depositAmount),
        paymentKind: 'inspection_deposit',
      },
      ...(connectParams && {
        transfer_data: { destination: connectParams.destination },
        application_fee_amount: Math.max(1, Math.round(amountCents * connectParams.feePercent)),
      }),
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      depositAmount,
      summary: {
        device: [quoteRequest.brand_name, quoteRequest.model_name].filter(Boolean).join(' '),
        repair: quoteRequest.repair_type_key || '',
        estimateTotal: estimate.total_amount,
        quoteId,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create payment.' },
      { status: 500 }
    )
  }
}
