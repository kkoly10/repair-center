import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { finalizeDepositPayment } from '../webhook/route'
import { checkRateLimit } from '../../../../lib/rateLimiter'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// Called by the client after Stripe redirects back on payment success.
// Verifies the payment intent status and finalizes the repair order.
export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed } = await checkRateLimit(ip, { maxRequests: 20, windowMs: 60 * 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const body = await request.json()
    const paymentIntentId = (body?.paymentIntentId || '').toString().trim()
    const quoteId = (body?.quoteId || '').toString().trim()

    if (!paymentIntentId || !quoteId) {
      return NextResponse.json({ error: 'paymentIntentId and quoteId are required.' }, { status: 400 })
    }

    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${paymentIntent.status}` },
        { status: 400 }
      )
    }

    const { quoteRequestId, estimateId, depositAmount } = paymentIntent.metadata || {}

    if (!quoteRequestId) {
      return NextResponse.json({ error: 'Payment intent is missing quote metadata.' }, { status: 400 })
    }

    const result = await finalizeDepositPayment({
      quoteRequestId,
      estimateId,
      depositAmount: Number(depositAmount || 0),
      paymentIntentId,
    })

    return NextResponse.json({
      ok: true,
      orderNumber: result.orderNumber,
      mailInPath: `/mail-in/${quoteId}`,
      trackingPath: `/track/${quoteId}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to verify payment.' },
      { status: 500 }
    )
  }
}
