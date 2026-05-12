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

  const supabase = getSupabaseAdmin()

  try {
    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select(
        'id, price_mode, public_price_fixed, public_price_min, public_price_max, deposit_amount, return_shipping_fee, warranty_days, active, created_at, repair_catalog_models(id, model_key, model_name, category, repair_catalog_brands(brand_name)), repair_types(id, repair_key, repair_name)'
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ ok: true, rules: rules || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load pricing rules.' },
      { status: 500 }
    )
  }
}
