import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured.')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const stripe = getStripe()

    const origin = request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000'

    const { data: paymentSettings, error: settingsError } = await supabase
      .from('organization_payment_settings')
      .select('stripe_connect_account_id')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (settingsError) throw settingsError

    let accountId = paymentSettings?.stripe_connect_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: { organization_id: orgId },
      })
      accountId = account.id

      const { error: upsertError } = await supabase
        .from('organization_payment_settings')
        .upsert(
          { organization_id: orgId, stripe_connect_account_id: accountId },
          { onConflict: 'organization_id' }
        )
      if (upsertError) throw upsertError
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/admin/billing/connect/refresh`,
      return_url: `${origin}/admin/billing/connect/return`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start Connect onboarding.' },
      { status: 500 }
    )
  }
}
