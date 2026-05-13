import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'
import { csvRow, csvResponse, fmtAmount, fmtDate } from '../../../../../lib/csvExport'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, phone, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const customerIds = (customers || []).map((c) => c.id)

  let ordersByCustomer = {}
  if (customerIds.length > 0) {
    const { data: orders } = await supabase
      .from('repair_orders')
      .select('id, customer_id, current_status')
      .eq('organization_id', orgId)
      .in('customer_id', customerIds)

    const orderIds = (orders || []).map((o) => o.id)
    let paymentsByOrder = {}

    if (orderIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('repair_order_id, amount')
        .eq('organization_id', orgId)
        .eq('status', 'paid')
        .in('repair_order_id', orderIds)

      for (const p of payments || []) {
        paymentsByOrder[p.repair_order_id] = (paymentsByOrder[p.repair_order_id] || 0) + Number(p.amount || 0)
      }
    }

    for (const o of orders || []) {
      if (!ordersByCustomer[o.customer_id]) {
        ordersByCustomer[o.customer_id] = { count: 0, completed: 0, totalPaid: 0 }
      }
      ordersByCustomer[o.customer_id].count++
      if (['shipped', 'delivered'].includes(o.current_status)) {
        ordersByCustomer[o.customer_id].completed++
      }
      ordersByCustomer[o.customer_id].totalPaid += paymentsByOrder[o.id] || 0
    }
  }

  const header = csvRow(['Name', 'Email', 'Phone', 'Orders', 'Completed', 'Total Paid', 'Repeat', 'Joined'])
  const rows = [header]

  for (const c of customers || []) {
    const stats = ordersByCustomer[c.id] || { count: 0, completed: 0, totalPaid: 0 }
    rows.push(csvRow([
      [c.first_name, c.last_name].filter(Boolean).join(' '),
      c.email || '',
      c.phone || '',
      stats.count,
      stats.completed,
      fmtAmount(stats.totalPaid),
      stats.count > 1 ? 'Yes' : 'No',
      fmtDate(c.created_at),
    ]))
  }

  const date = fmtDate(new Date().toISOString())
  return csvResponse(rows, `customers-${date}.csv`)
}
