import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function PATCH(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const ruleId = params?.ruleId

    const body = await request.json()
    const allowed = [
      'price_mode', 'public_price_fixed', 'public_price_min', 'public_price_max',
      'deposit_amount', 'return_shipping_fee', 'warranty_days', 'active',
    ]

    const update = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key] === '' ? null : body[key]
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    if (update.price_mode && !['fixed', 'range', 'manual'].includes(update.price_mode)) {
      return NextResponse.json({ error: 'Invalid price_mode.' }, { status: 400 })
    }

    // Enforce: manual mode clears public price fields
    if (update.price_mode === 'manual') {
      update.public_price_fixed = null
      update.public_price_min = null
      update.public_price_max = null
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .update(update)
      .eq('id', ruleId)
      .eq('organization_id', orgId)
      .select('id, price_mode, public_price_fixed, public_price_min, public_price_max, deposit_amount, return_shipping_fee, warranty_days, active')
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Pricing rule not found.' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, rule: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update pricing rule.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  const params = await context.params
  const ruleId = params?.ruleId

  const { data: existing, error: lookupError } = await supabase
    .from('pricing_rules')
    .select('id')
    .eq('id', ruleId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Pricing rule not found.' }, { status: 404 })

  const { error: deleteError } = await supabase
    .from('pricing_rules')
    .delete()
    .eq('id', ruleId)
    .eq('organization_id', orgId)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
