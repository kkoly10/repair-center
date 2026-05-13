import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'

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
    const { orderId } = await context.params

    // Verify order belongs to org
    const { data: order, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    const { data, error } = await supabase
      .from('repair_order_parts')
      .select('id, part_id, quantity_used, cost_at_use, notes, created_at, parts(name, sku)')
      .eq('repair_order_id', orderId)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const partsUsed = (data || []).map((row) => ({
      id: row.id,
      part_id: row.part_id,
      part_name: row.parts?.name || 'Unknown Part',
      part_sku: row.parts?.sku || null,
      quantity_used: row.quantity_used,
      cost_at_use: Number(row.cost_at_use || 0),
      total_cost: Number(row.cost_at_use || 0) * row.quantity_used,
      notes: row.notes || null,
      created_at: row.created_at,
    }))

    const totalPartsCost = partsUsed.reduce((s, r) => s + r.total_cost, 0)

    return NextResponse.json({ ok: true, partsUsed, totalPartsCost })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load parts.' },
      { status: 500 }
    )
  }
}

export async function POST(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { orderId } = await context.params

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
    }

    const { part_id, quantity_used, notes } = body

    if (!part_id) return NextResponse.json({ error: 'part_id is required.' }, { status: 400 })
    const qty = Number(quantity_used || 1)
    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ error: 'quantity_used must be a positive integer.' }, { status: 400 })
    }

    // Verify order belongs to org
    const { data: order, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    // Verify part belongs to org and get current cost
    const { data: part, error: partError } = await supabase
      .from('parts')
      .select('id, cost_price, quantity_on_hand')
      .eq('id', part_id)
      .eq('organization_id', orgId)
      .eq('active', true)
      .maybeSingle()

    if (partError) throw partError
    if (!part) return NextResponse.json({ error: 'Part not found.' }, { status: 404 })

    if (part.quantity_on_hand < qty) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${part.quantity_on_hand}, requested: ${qty}.` },
        { status: 409 }
      )
    }

    // Record usage and decrement stock in parallel
    const [insertResult, decrementResult] = await Promise.all([
      supabase
        .from('repair_order_parts')
        .insert({
          organization_id: orgId,
          repair_order_id: orderId,
          part_id,
          quantity_used: qty,
          cost_at_use: part.cost_price,
          notes: notes?.trim() || null,
        })
        .select('id')
        .single(),
      supabase
        .from('parts')
        .update({
          quantity_on_hand: part.quantity_on_hand - qty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', part_id)
        .eq('organization_id', orgId),
    ])

    if (insertResult.error) throw insertResult.error
    if (decrementResult.error) throw decrementResult.error

    return NextResponse.json({ ok: true, id: insertResult.data.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to record part usage.' },
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
    const { orderId } = await context.params
    const { searchParams } = new URL(request.url)
    const usageId = searchParams.get('usageId')

    if (!usageId) return NextResponse.json({ error: 'usageId query param required.' }, { status: 400 })

    // Fetch usage to get quantity and part for stock restoration
    const { data: usage, error: fetchError } = await supabase
      .from('repair_order_parts')
      .select('id, part_id, quantity_used')
      .eq('id', usageId)
      .eq('repair_order_id', orderId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!usage) return NextResponse.json({ error: 'Usage record not found.' }, { status: 404 })

    // Delete usage record
    const { error: deleteError } = await supabase
      .from('repair_order_parts')
      .delete()
      .eq('id', usageId)
      .eq('organization_id', orgId)

    if (deleteError) throw deleteError

    // Restore stock: fetch current quantity then increment
    const { data: part, error: partFetchError } = await supabase
      .from('parts')
      .select('quantity_on_hand')
      .eq('id', usage.part_id)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!partFetchError && part) {
      await supabase
        .from('parts')
        .update({
          quantity_on_hand: part.quantity_on_hand + usage.quantity_used,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usage.part_id)
        .eq('organization_id', orgId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to remove part usage.' },
      { status: 500 }
    )
  }
}
