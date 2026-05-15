import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const [orgResult, subResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('id, name, status, plan_key, trial_ends_at, stripe_customer_id')
        .eq('id', orgId)
        .single(),
      supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle(),
    ])

    if (orgResult.error) throw orgResult.error

    const org = orgResult.data
    const sub = subResult.data || null

    const trialEndsAt = sub?.trial_ends_at || org.trial_ends_at || null
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt) - Date.now()) / 86400000))
      : null

    return NextResponse.json({
      ok: true,
      orgId,
      billing: {
        status: org.status,
        planKey: sub?.plan_key || org.plan_key || 'pro',
        trialEndsAt,
        trialDaysLeft,
        currentPeriodEnd: sub?.current_period_end || null,
        cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
        hasActiveSubscription: !!sub?.stripe_subscription_id,
        stripeCustomerId: org.stripe_customer_id || sub?.stripe_customer_id || null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load billing.' },
      { status: 500 }
    )
  }
}
