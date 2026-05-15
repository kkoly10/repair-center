import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

const TERMINAL_STATUSES = new Set([
  'shipped', 'delivered', 'cancelled', 'declined',
  'returned_unrepaired', 'beyond_economical_repair', 'no_fault_found',
])

export async function GET(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()
  const url = new URL(request?.url ?? 'http://localhost/admin/api/customers')
  const q = url.searchParams.get('q')?.trim() || ''

  // Typeahead path: skip orders join, return lightweight results fast
  if (q.length >= 2) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone, created_at')
        .eq('organization_id', orgId)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const customers = (data || []).map((c) => ({
        id: c.id,
        name: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown',
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
      }))

      return NextResponse.json({ ok: true, customers })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unable to search customers.' },
        { status: 500 }
      )
    }
  }

  try {
    const [customersResult, ordersResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      supabase
        .from('repair_orders')
        .select('id, customer_id, current_status, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
    ])

    if (customersResult.error) throw customersResult.error
    if (ordersResult.error) throw ordersResult.error

    const orders = ordersResult.data || []

    const customers = (customersResult.data || []).map((c) => {
      const customerOrders = orders.filter((o) => o.customer_id === c.id)
      const lastOrder = customerOrders[0] || null
      const completedOrders = customerOrders.filter((o) => TERMINAL_STATUSES.has(o.current_status))

      return {
        id: c.id,
        name: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: c.email,
        phone: c.phone,
        created_at: c.created_at,
        order_count: customerOrders.length,
        completed_count: completedOrders.length,
        last_order_at: lastOrder?.created_at || null,
        is_repeat: customerOrders.length > 1,
      }
    })

    return NextResponse.json({ ok: true, customers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load customers.' },
      { status: 500 }
    )
  }
}
