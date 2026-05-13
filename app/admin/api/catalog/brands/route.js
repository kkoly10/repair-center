import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

function slugify(name, orgId) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    .from('repair_catalog_brands')
    .select('id, brand_name, category, slug, active, organization_id')
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .order('brand_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const brands = (data || []).map((b) => ({ ...b, is_org_owned: b.organization_id === orgId }))
  return NextResponse.json({ ok: true, brands })
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

  const brandName = (body.brandName || '').trim()
  const category = body.category
  const CATEGORIES = ['phone', 'tablet', 'laptop', 'desktop']

  if (!brandName) return NextResponse.json({ error: 'brandName is required.' }, { status: 400 })
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const slug = slugify(brandName, orgId)

  const { data, error } = await supabase
    .from('repair_catalog_brands')
    .insert({ brand_name: brandName, category, slug, active: true, organization_id: orgId })
    .select('id, brand_name, category, slug, active, organization_id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A brand with this name already exists.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, brand: { ...data, is_org_owned: true } }, { status: 201 })
}
