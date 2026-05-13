import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

function repairKey(name, orgId) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return `${base}_${orgId.slice(0, 8)}`
}

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('repair_types')
    .select('id, repair_key, repair_name, category, price_mode_default, warranty_days_default, active, organization_id')
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .order('repair_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const repairTypes = (data || []).map((r) => ({ ...r, is_org_owned: r.organization_id === orgId }))
  return NextResponse.json({ ok: true, repairTypes })
}

export async function POST(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const repairName = (body.repairName || '').trim()
  const priceMode = body.priceModeDefault || 'manual'
  const PRICE_MODES = ['fixed', 'range', 'manual']
  const CATEGORIES = ['phone', 'tablet', 'laptop', 'desktop']

  if (!repairName) return NextResponse.json({ error: 'repairName is required.' }, { status: 400 })
  if (!PRICE_MODES.includes(priceMode)) return NextResponse.json({ error: 'Invalid priceModeDefault.' }, { status: 400 })
  if (body.category && !CATEGORIES.includes(body.category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const key = repairKey(repairName, orgId)

  const { data, error } = await supabase
    .from('repair_types')
    .insert({
      repair_key: key,
      repair_name: repairName,
      category: body.category || null,
      price_mode_default: priceMode,
      warranty_days_default: body.warrantyDaysDefault ? Number(body.warrantyDaysDefault) : null,
      active: true,
      organization_id: orgId,
    })
    .select('id, repair_key, repair_name, category, price_mode_default, warranty_days_default, active, organization_id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A repair type with this name already exists.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, repairType: { ...data, is_org_owned: true } }, { status: 201 })
}
