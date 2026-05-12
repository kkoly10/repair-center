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
    const params = await context.params
    const customerId = params?.customerId

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customer ID.' }, { status: 400 })
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, created_at')
      .eq('id', customerId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (customerError) throw customerError
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })
    }

    const [ordersResult, quotesResult] = await Promise.all([
      supabase
        .from('repair_orders')
        .select('id, order_number, current_status, created_at, intake_received_at, shipped_at, delivered_at, quote_request_id')
        .eq('customer_id', customerId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      supabase
        .from('quote_requests')
        .select('id, quote_id, brand_name, model_name, repair_type_key, status, created_at')
        .eq('customer_id', customerId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
    ])

    if (ordersResult.error) throw ordersResult.error
    if (quotesResult.error) throw quotesResult.error

    const orders = ordersResult.data || []
    const quotes = quotesResult.data || []

    // Fetch paid payment totals for all orders
    let totalPaid = 0
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('repair_order_id, amount, status')
        .in('repair_order_id', orderIds)
        .eq('status', 'paid')
        .order('created_at', { ascending: true })

      if (paymentsError) throw paymentsError
      totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
    }

    const TERMINAL_STATUSES = new Set([
      'shipped', 'delivered', 'cancelled', 'declined',
      'returned_unrepaired', 'beyond_economical_repair', 'no_fault_found',
    ])

    // Build a quoteId → quote lookup for enriching orders
    const quoteById = Object.fromEntries(quotes.map((q) => [q.id, q]))

    const enrichedOrders = orders.map((o) => {
      const quote = quoteById[o.quote_request_id] || {}
      return {
        id: o.id,
        order_number: o.order_number,
        current_status: o.current_status,
        created_at: o.created_at,
        shipped_at: o.shipped_at,
        delivered_at: o.delivered_at,
        quote_id: quote.quote_id || null,
        brand_name: quote.brand_name || null,
        model_name: quote.model_name || null,
        repair_type_key: quote.repair_type_key || null,
        is_terminal: TERMINAL_STATUSES.has(o.current_status),
      }
    })

    return NextResponse.json({
      ok: true,
      customer: {
        id: customer.id,
        name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: customer.email,
        phone: customer.phone,
        created_at: customer.created_at,
        order_count: orders.length,
        total_paid: totalPaid,
        is_repeat: orders.length > 1,
      },
      orders: enrichedOrders,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load customer.' },
      { status: 500 }
    )
  }
}
