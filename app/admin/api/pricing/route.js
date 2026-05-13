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

export async function POST(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { modelId, repairTypeId, priceMode = 'manual' } = body || {}

  if (!modelId || !repairTypeId) {
    return NextResponse.json({ error: 'modelId and repairTypeId are required.' }, { status: 400 })
  }
  if (!['fixed', 'range', 'manual'].includes(priceMode)) {
    return NextResponse.json({ error: 'Invalid priceMode.' }, { status: 400 })
  }

  // Verify model and repair type exist
  const [modelResult, repairTypeResult] = await Promise.all([
    supabase.from('repair_catalog_models').select('id').eq('id', modelId).maybeSingle(),
    supabase.from('repair_types').select('id').eq('id', repairTypeId).maybeSingle(),
  ])

  if (!modelResult.data) return NextResponse.json({ error: 'Model not found.' }, { status: 404 })
  if (!repairTypeResult.data) return NextResponse.json({ error: 'Repair type not found.' }, { status: 404 })

  const insert = {
    organization_id: orgId,
    model_id: modelId,
    repair_type_id: repairTypeId,
    price_mode: priceMode,
    public_price_fixed: priceMode === 'fixed' ? (Number(body.publicPriceFixed) || null) : null,
    public_price_min: priceMode === 'range' ? (Number(body.publicPriceMin) || null) : null,
    public_price_max: priceMode === 'range' ? (Number(body.publicPriceMax) || null) : null,
    deposit_amount: Number(body.depositAmount) || null,
    warranty_days: Number(body.warrantyDays) || null,
    active: body.active !== false,
  }

  const { data: rule, error: insertError } = await supabase
    .from('pricing_rules')
    .insert(insert)
    .select('id, price_mode, public_price_fixed, public_price_min, public_price_max, deposit_amount, warranty_days, active, repair_catalog_models(model_name, repair_catalog_brands(brand_name)), repair_types(repair_name)')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'A pricing rule for this model and repair type already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rule }, { status: 201 })
}

