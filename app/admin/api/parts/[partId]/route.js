import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { partId } = await context.params

    const { data, error } = await supabase
      .from('parts')
      .select('id, name, sku, description, cost_price, quantity_on_hand, low_stock_threshold, active, supplier_id, suppliers(name), created_at, updated_at')
      .eq('id', partId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Part not found.' }, { status: 404 })

    return NextResponse.json({
      ok: true,
      part: {
        id: data.id,
        name: data.name,
        sku: data.sku || null,
        description: data.description || null,
        cost_price: Number(data.cost_price || 0),
        quantity_on_hand: data.quantity_on_hand,
        low_stock_threshold: data.low_stock_threshold,
        is_low_stock: data.low_stock_threshold > 0 && data.quantity_on_hand <= data.low_stock_threshold,
        active: data.active,
        supplier_id: data.supplier_id || null,
        supplier_name: data.suppliers?.name || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load part.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { partId } = await context.params

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
    }

    // Verify part belongs to this org before updating
    const { data: existing, error: fetchError } = await supabase
      .from('parts')
      .select('id')
      .eq('id', partId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!existing) return NextResponse.json({ error: 'Part not found.' }, { status: 404 })

    const allowed = ['name', 'sku', 'description', 'cost_price', 'quantity_on_hand', 'low_stock_threshold', 'supplier_id', 'active']
    const updates = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (updates.name !== undefined && !updates.name?.trim()) {
      return NextResponse.json({ error: 'Part name cannot be empty.' }, { status: 400 })
    }
    if (updates.name) updates.name = updates.name.trim()
    if (updates.sku !== undefined) updates.sku = updates.sku?.trim() || null
    if (updates.description !== undefined) updates.description = updates.description?.trim() || null
    updates.updated_at = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', partId)
      .eq('organization_id', orgId)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update part.' },
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

  try {
    const { partId } = await context.params

    const { data: existing, error: fetchError } = await supabase
      .from('parts')
      .select('id')
      .eq('id', partId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!existing) return NextResponse.json({ error: 'Part not found.' }, { status: 404 })

    // Soft-delete: mark inactive rather than hard delete
    const { error } = await supabase
      .from('parts')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', partId)
      .eq('organization_id', orgId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete part.' },
      { status: 500 }
    )
  }
}
