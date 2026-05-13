import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function PATCH(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const { typeId } = await context.params
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: existing, error: lookupError } = await supabase
    .from('repair_types')
    .select('id')
    .eq('id', typeId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Repair type not found or not editable.' }, { status: 404 })

  const PRICE_MODES = ['fixed', 'range', 'manual']
  const CATEGORIES = ['phone', 'tablet', 'laptop', 'desktop']
  const update = {}
  if (body.repairName !== undefined) {
    const name = (body.repairName || '').trim()
    if (!name) return NextResponse.json({ error: 'repairName cannot be empty.' }, { status: 400 })
    update.repair_name = name
  }
  if (body.category !== undefined) {
    if (body.category && !CATEGORIES.includes(body.category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    update.category = body.category || null
  }
  if (body.priceModeDefault !== undefined) {
    if (!PRICE_MODES.includes(body.priceModeDefault)) return NextResponse.json({ error: 'Invalid priceModeDefault.' }, { status: 400 })
    update.price_mode_default = body.priceModeDefault
  }
  if (body.warrantyDaysDefault !== undefined) update.warranty_days_default = body.warrantyDaysDefault ? Number(body.warrantyDaysDefault) : null
  if (body.active !== undefined) update.active = Boolean(body.active)

  if (!Object.keys(update).length) return NextResponse.json({ error: 'No valid fields.' }, { status: 400 })

  const { data, error } = await supabase
    .from('repair_types')
    .update(update)
    .eq('id', typeId)
    .eq('organization_id', orgId)
    .select('id, repair_key, repair_name, category, price_mode_default, warranty_days_default, active, organization_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, repairType: { ...data, is_org_owned: true } })
}

export async function DELETE(_request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const { typeId } = await context.params
  const supabase = getSupabaseAdmin()

  const { data: existing, error: lookupError } = await supabase
    .from('repair_types')
    .select('id')
    .eq('id', typeId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Repair type not found or not deletable.' }, { status: 404 })

  const { error } = await supabase
    .from('repair_types')
    .delete()
    .eq('id', typeId)
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
