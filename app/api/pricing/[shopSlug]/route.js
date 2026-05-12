import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const shopSlug = (params?.shopSlug || '').toString().trim()

    if (!shopSlug) {
      return NextResponse.json({ error: 'Shop slug is required.' }, { status: 400 })
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', shopSlug)
      .eq('status', 'active')
      .maybeSingle()

    if (orgError) throw orgError
    if (!org) {
      return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })
    }

    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select(
        'id, model_id, repair_type_id, public_price_fixed, public_price_min, public_price_max, deposit_amount'
      )
      .eq('organization_id', org.id)
      .eq('active', true)

    if (rulesError) throw rulesError

    return NextResponse.json({
      ok: true,
      orgId: org.id,
      orgName: org.name,
      slug: org.slug,
      rules: rules || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load pricing.' },
      { status: 500 }
    )
  }
}
