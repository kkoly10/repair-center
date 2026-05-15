import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured.')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request) {
  if (!process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Connect webhook secret not configured.' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature invalid: ${err.message}` },
      { status: 400 }
    )
  }

  if (event.type !== 'account.updated') {
    return NextResponse.json({ received: true })
  }

  try {
    const account = event.data.object
    const orgId = account.metadata?.organization_id

    if (!orgId) {
      return NextResponse.json({ received: true })
    }

    const supabase = getSupabaseAdmin()
    const chargesEnabled = account.charges_enabled === true
    const payoutsEnabled = account.payouts_enabled === true

    const { error } = await supabase
      .from('organization_payment_settings')
      .upsert(
        {
          organization_id: orgId,
          stripe_connect_charges_enabled: chargesEnabled,
          stripe_connect_payouts_enabled: payoutsEnabled,
          stripe_connect_onboarding_complete: chargesEnabled,
        },
        { onConflict: 'organization_id' }
      )

    if (error) throw error
  } catch (err) {
    console.error('[connect-webhook] Error handling account.updated:', err)
  }

  return NextResponse.json({ received: true })
}
