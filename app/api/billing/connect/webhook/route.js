import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { reportError } from '../../../../../lib/observability'

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

  if (event.type === 'account.updated') {
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
      reportError(err, {
        area: 'billing-connect-webhook',
        eventKey: event?.type,
      })
    }

    return NextResponse.json({ received: true })
  }

  // Shop revoked the platform's OAuth access. Stripe sends this event on the
  // platform's webhook endpoint; the connected account id is in event.account
  // (not event.data.object). We must clear the connect linkage and downgrade
  // payment_mode so future quote-approval flows don't try to charge a
  // disconnected account.
  if (event.type === 'account.application.deauthorized') {
    const accountId = event.account

    try {
      if (!accountId) {
        // Nothing to do, but log so we know if Stripe ever sends this without
        // a connected account id (shouldn't happen)
        reportError(new Error('account.application.deauthorized missing event.account'), {
          area: 'billing-connect-webhook',
          eventKey: 'account.application.deauthorized',
        })
        return NextResponse.json({ received: true })
      }

      const supabase = getSupabaseAdmin()

      const { data: settings, error: lookupError } = await supabase
        .from('organization_payment_settings')
        .select('organization_id, payment_mode')
        .eq('stripe_connect_account_id', accountId)
        .maybeSingle()

      if (lookupError) throw lookupError

      if (!settings?.organization_id) {
        // No org mapping found — possibly already cleared. Still log so we
        // have a record of the deauthorization in Sentry.
        reportError(new Error(`Stripe Connect deauthorized for unknown account ${accountId}`), {
          area: 'billing-connect-webhook',
          eventKey: 'account.application.deauthorized',
          accountId,
        })
        return NextResponse.json({ received: true })
      }

      const update = {
        stripe_connect_account_id: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        stripe_connect_onboarding_complete: false,
      }
      if (settings.payment_mode === 'stripe_connect') {
        update.payment_mode = 'manual'
      }

      const { error: updateError } = await supabase
        .from('organization_payment_settings')
        .update(update)
        .eq('organization_id', settings.organization_id)

      if (updateError) throw updateError

      // Surface as a Sentry operational signal — not a true error, but
      // something the operator should see.
      reportError(new Error(`Stripe Connect deauthorized for org ${settings.organization_id}`), {
        area: 'billing-connect-webhook',
        eventKey: 'account.application.deauthorized',
        accountId,
        organizationId: settings.organization_id,
        downgradedPaymentMode: settings.payment_mode === 'stripe_connect',
      })
    } catch (err) {
      reportError(err, {
        area: 'billing-connect-webhook',
        eventKey: 'account.application.deauthorized',
        accountId,
      })
    }

    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
