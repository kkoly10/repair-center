import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

function modelKey(brandSlug, modelName, orgId) {
  const base = `${brandSlug}-${modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
  return `${base}-${orgId.slice(0, 8)}`
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
    .from('repair_catalog_models')
    .select('id, model_key, model_name, family_name, category, active, organization_id, repair_catalog_brands(id, brand_name, category)')
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .order('model_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const models = (data || []).map((m) => ({ ...m, is_org_owned: m.organization_id === orgId }))
  return NextResponse.json({ ok: true, models })
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

  const modelName = (body.modelName || '').trim()
  const familyName = (body.familyName || '').trim() || null
  const brandId = body.brandId
  const category = body.category
  const CATEGORIES = ['phone', 'tablet', 'laptop', 'desktop']

  if (!modelName) return NextResponse.json({ error: 'modelName is required.' }, { status: 400 })
  if (!brandId) return NextResponse.json({ error: 'brandId is required.' }, { status: 400 })
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Verify brand belongs to global catalog or this org
  const { data: brand, error: brandError } = await supabase
    .from('repair_catalog_brands')
    .select('id, slug')
    .eq('id', brandId)
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .maybeSingle()

  if (brandError) return NextResponse.json({ error: brandError.message }, { status: 500 })
  if (!brand) return NextResponse.json({ error: 'Brand not found.' }, { status: 404 })

  const key = modelKey(brand.slug, modelName, orgId)

  const { data, error } = await supabase
    .from('repair_catalog_models')
    .insert({
      brand_id: brandId,
      model_key: key,
      model_name: modelName,
      family_name: familyName,
      category,
      active: true,
      organization_id: orgId,
    })
    .select('id, model_key, model_name, family_name, category, active, organization_id, repair_catalog_brands(id, brand_name, category)')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A model with this name already exists.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, model: { ...data, is_org_owned: true } }, { status: 201 })
}
