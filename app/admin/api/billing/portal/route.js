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

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', orgId)
      .single()

    if (orgError) throw orgError

    // Also check subscriptions table as fallback
    let stripeCustomerId = org.stripe_customer_id
    if (!stripeCustomerId) {
      const { data: sub } = await supabase
        .from('organization_subscriptions')
        .select('stripe_customer_id')
        .eq('organization_id', orgId)
        .maybeSingle()
      stripeCustomerId = sub?.stripe_customer_id || null
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { returnUrl } = await request.json().catch(() => ({}))

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${origin}/admin/billing`,
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to open billing portal.' },
      { status: 500 }
    )
  }
}
