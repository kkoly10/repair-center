import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function POST(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const supabase = getSupabaseAdmin()
    const priceId = process.env.STRIPE_BILLING_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: 'Billing not configured.' }, { status: 500 })
    }

    const { returnUrl } = await request.json().catch(() => ({}))
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = returnUrl || `${origin}/admin/billing?success=1`
    const cancelUrl = `${origin}/admin/billing`

    // Look up org for name + existing Stripe customer
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, stripe_customer_id')
      .eq('id', orgId)
      .single()

    if (orgError) throw orgError

    // Look up email from the first owner's profile
    const { data: owner } = await supabase
      .from('organization_members')
      .select('profiles(email)')
      .eq('organization_id', orgId)
      .eq('role', 'owner')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    const email = owner?.profiles?.email || undefined

    // Reuse existing Stripe customer or create a new one
    let stripeCustomerId = org.stripe_customer_id
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email,
        metadata: { organization_id: orgId, slug: org.slug },
      })
      stripeCustomerId = customer.id

      // Persist on org row so future calls reuse it
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', orgId)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { organization_id: orgId },
      },
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create checkout session.' },
      { status: 500 }
    )
  }
}
