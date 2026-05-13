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

  const { brandId } = await context.params
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: existing, error: lookupError } = await supabase
    .from('repair_catalog_brands')
    .select('id, organization_id')
    .eq('id', brandId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Brand not found or not editable.' }, { status: 404 })

  const CATEGORIES = ['phone', 'tablet', 'laptop', 'desktop']
  const update = {}
  if (body.brandName !== undefined) {
    const name = (body.brandName || '').trim()
    if (!name) return NextResponse.json({ error: 'brandName cannot be empty.' }, { status: 400 })
    update.brand_name = name
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    update.category = body.category
  }
  if (body.active !== undefined) update.active = Boolean(body.active)

  if (!Object.keys(update).length) return NextResponse.json({ error: 'No valid fields.' }, { status: 400 })

  const { data, error } = await supabase
    .from('repair_catalog_brands')
    .update(update)
    .eq('id', brandId)
    .eq('organization_id', orgId)
    .select('id, brand_name, category, slug, active, organization_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, brand: { ...data, is_org_owned: true } })
}

export async function DELETE(_request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const { brandId } = await context.params
  const supabase = getSupabaseAdmin()

  const { data: existing, error: lookupError } = await supabase
    .from('repair_catalog_brands')
    .select('id')
    .eq('id', brandId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Brand not found or not deletable.' }, { status: 404 })

  const { error } = await supabase
    .from('repair_catalog_brands')
    .delete()
    .eq('id', brandId)
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
