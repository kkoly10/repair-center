import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured.')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: paymentSettings, error: settingsError } = await supabase
      .from('organization_payment_settings')
      .select('stripe_connect_account_id')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (settingsError) throw settingsError

    const accountId = paymentSettings?.stripe_connect_account_id
    if (!accountId) {
      return NextResponse.json({ connected: false })
    }

    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(accountId)

    const chargesEnabled = account.charges_enabled === true
    const payoutsEnabled = account.payouts_enabled === true

    const { error: upsertError } = await supabase
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
    if (upsertError) throw upsertError

    return NextResponse.json({ connected: true, chargesEnabled, payoutsEnabled, accountId })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load Connect status.' },
      { status: 500 }
    )
  }
}
