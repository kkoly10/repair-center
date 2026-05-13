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

  const [modelsResult, repairTypesResult, existingResult] = await Promise.all([
    supabase
      .from('repair_catalog_models')
      .select('id, model_key, model_name, category, family_name, repair_catalog_brands(brand_name, category)')
      .or(`organization_id.is.null,organization_id.eq.${orgId}`)
      .eq('active', true)
      .order('model_name', { ascending: true }),
    supabase
      .from('repair_types')
      .select('id, repair_key, repair_name, category, price_mode_default')
      .or(`organization_id.is.null,organization_id.eq.${orgId}`)
      .order('repair_name', { ascending: true }),
    supabase
      .from('pricing_rules')
      .select('model_id, repair_type_id')
      .eq('organization_id', orgId),
  ])

  if (modelsResult.error) return NextResponse.json({ error: modelsResult.error.message }, { status: 500 })
  if (repairTypesResult.error) return NextResponse.json({ error: repairTypesResult.error.message }, { status: 500 })
  if (existingResult.error) return NextResponse.json({ error: existingResult.error.message }, { status: 500 })

  const existingKeys = new Set(
    (existingResult.data || []).map((r) => `${r.model_id}:${r.repair_type_id}`)
  )

  return NextResponse.json({
    ok: true,
    models: modelsResult.data || [],
    repairTypes: repairTypesResult.data || [],
    existingKeys: [...existingKeys],
  })
}
