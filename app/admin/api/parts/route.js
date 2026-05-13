import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const lowStock = searchParams.get('low_stock') === '1'

  try {
    const { data, error } = await supabase
      .from('parts')
      .select('id, name, sku, description, cost_price, quantity_on_hand, low_stock_threshold, active, supplier_id, suppliers(name), created_at, updated_at')
      .eq('organization_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error

    let parts = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || null,
      description: p.description || null,
      cost_price: Number(p.cost_price || 0),
      quantity_on_hand: p.quantity_on_hand,
      low_stock_threshold: p.low_stock_threshold,
      is_low_stock: p.low_stock_threshold > 0 && p.quantity_on_hand <= p.low_stock_threshold,
      active: p.active,
      supplier_id: p.supplier_id || null,
      supplier_name: p.suppliers?.name || null,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))

    const lowStockCount = parts.filter((p) => p.is_low_stock && p.active).length
    if (lowStock) parts = parts.filter((p) => p.is_low_stock)

    return NextResponse.json({ ok: true, parts, lowStockCount })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load parts.' },
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

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
    }

    const { name, sku, description, cost_price, quantity_on_hand, low_stock_threshold, supplier_id } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Part name is required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('parts')
      .insert({
        organization_id: orgId,
        name: name.trim(),
        sku: sku?.trim() || null,
        description: description?.trim() || null,
        cost_price: Number(cost_price || 0),
        quantity_on_hand: Number(quantity_on_hand || 0),
        low_stock_threshold: Number(low_stock_threshold || 0),
        supplier_id: supplier_id || null,
        active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create part.' },
      { status: 500 }
    )
  }
}
