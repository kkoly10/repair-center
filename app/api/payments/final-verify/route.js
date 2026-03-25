import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { finalizeFinalBalancePayment } from '../../../../../lib/payments/finalizeFinalBalancePayment'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const paymentIntentId = (body?.paymentIntentId || '').toString().trim()
    const quoteId = (body?.quoteId || '').toString().trim()

    if (!paymentIntentId || !quoteId) {
      return NextResponse.json(
        { error: 'paymentIntentId and quoteId are required.' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${paymentIntent.status}` },
        { status: 400 }
      )
    }

    const metadata = paymentIntent.metadata || {}
    const quoteRequestId = metadata.quoteRequestId
    const repairOrderId = metadata.repairOrderId
    const estimateId = metadata.estimateId
    const amount = Number(metadata.finalBalanceAmount || 0)
    const paymentKind = metadata.paymentKind

    if (!quoteRequestId || paymentKind !== 'final_balance') {
      return NextResponse.json(
        { error: 'Payment intent is missing final balance metadata.' },
        { status: 400 }
      )
    }

    const result = await finalizeFinalBalancePayment({
      quoteRequestId,
      repairOrderId,
      estimateId,
      paymentIntentId,
      amount,
    })

    return NextResponse.json({
      ok: true,
      trackingPath: `/track/${quoteId}`,
      completePath: `/pay/${quoteId}/balance/complete`,
      nextStatus: result.nextStatus || 'ready_to_ship',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to verify final balance payment.',
      },
      { status: 500 }
    )
  }
}
