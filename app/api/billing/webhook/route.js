import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

// Stripe sends the raw body for signature verification — disable body parsing
export const dynamic = 'force-dynamic'

async function upsertSubscription(supabase, orgId, subscription) {
  const payload = {
    organization_id: orgId,
    stripe_customer_id: typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items?.data?.[0]?.price?.id || null,
    plan_key: subscription.metadata?.plan_key || 'pro',
    status: subscription.status,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('organization_subscriptions')
    .upsert(payload, { onConflict: 'organization_id' })

  if (error) throw error

  // Sync org status
  const orgStatus =
    subscription.status === 'active' ? 'active'
    : subscription.status === 'trialing' ? 'trialing'
    : subscription.status === 'past_due' ? 'past_due'
    : subscription.status === 'canceled' ? 'cancelled'
    : 'suspended'

  await supabase
    .from('organizations')
    .update({ status: orgStatus, stripe_customer_id: payload.stripe_customer_id })
    .eq('id', orgId)
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 500 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature invalid: ${err.message}` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription' || !session.subscription) break

        // Retrieve subscription first — its metadata is the authoritative source of orgId
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const orgId = subscription.metadata?.organization_id
          || session.subscription_data?.metadata?.organization_id
          || session.metadata?.organization_id
        if (!orgId) break

        await upsertSubscription(supabase, orgId, subscription)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const orgId = subscription.metadata?.organization_id
        if (!orgId) break
        await upsertSubscription(supabase, orgId, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (!invoice.subscription) break
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const orgId = subscription.metadata?.organization_id
        if (!orgId) break
        await upsertSubscription(supabase, orgId, subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (!invoice.subscription) break
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const orgId = subscription.metadata?.organization_id
        if (!orgId) break

        // Mark org as past_due; let subscription.updated handle full upsert
        await supabase
          .from('organizations')
          .update({ status: 'past_due' })
          .eq('id', orgId)
        break
      }

      default:
        // Unhandled event types — acknowledge without action
        break
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler error.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
