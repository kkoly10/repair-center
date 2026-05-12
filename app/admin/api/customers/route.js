import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

const TERMINAL_STATUSES = new Set([
  'shipped', 'delivered', 'cancelled', 'declined',
  'returned_unrepaired', 'beyond_economical_repair', 'no_fault_found',
])

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

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
