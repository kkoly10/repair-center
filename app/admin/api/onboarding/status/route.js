import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

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

    const [orgResult, brandingResult, pricingResult, paymentResult, estimatesResult] =
      await Promise.all([
        supabase.from('organizations').select('onboarding_dismissed_at').eq('id', orgId).single(),
        supabase.from('organization_branding').select('logo_url, primary_color, hero_headline').eq('organization_id', orgId).maybeSingle(),
        supabase.from('pricing_rules').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('active', true),
        supabase.from('organization_payment_settings').select('payment_mode, manual_payment_instructions').eq('organization_id', orgId).maybeSingle(),
        supabase.from('quote_estimates').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'sent'),
      ])

    if (orgResult.error) throw orgResult.error
    if (brandingResult.error) throw brandingResult.error
    if (pricingResult.error) throw pricingResult.error
    if (paymentResult.error) throw paymentResult.error
    if (estimatesResult.error) throw estimatesResult.error

    const b = brandingResult.data
    const profileComplete = !!(b?.primary_color || b?.logo_url || b?.hero_headline)
    const pricingComplete = (pricingResult.count ?? 0) > 0
    const p = paymentResult.data
    const paymentComplete = !!(p && (p.manual_payment_instructions || p.payment_mode !== 'manual'))
    const estimatesComplete = (estimatesResult.count ?? 0) > 0

    return NextResponse.json({
      ok: true,
      dismissedAt: orgResult.data?.onboarding_dismissed_at ?? null,
      steps: {
        accountCreated: true,
        profileComplete,
        pricingComplete,
        paymentComplete,
        estimatesSent: estimatesComplete,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load onboarding status.' },
      { status: 500 }
    )
  }
}
