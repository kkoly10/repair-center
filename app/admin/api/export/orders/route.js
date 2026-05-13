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

  const { data: orders, error } = await supabase
    .from('repair_orders')
    .select(`
      id,
      order_number,
      current_status,
      priority,
      due_at,
      created_at,
      inspection_deposit_required,
      quote_requests(
        quote_id,
        first_name,
        last_name,
        guest_email,
        brand_name,
        model_name,
        repair_type_key
      ),
      customers(first_name, last_name, email)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const orderIds = (orders || []).map((o) => o.id)
  let paymentsByOrder = {}
  let techByOrder = {}

  if (orderIds.length > 0) {
    const [paymentsResult, techResult] = await Promise.all([
      supabase
        .from('payments')
        .select('repair_order_id, amount')
        .eq('organization_id', orgId)
        .eq('status', 'paid')
        .in('repair_order_id', orderIds),
      supabase
        .from('repair_orders')
        .select('id, assigned_technician_user_id, organization_members(profiles(full_name))')
        .eq('organization_id', orgId)
        .in('id', orderIds),
    ])

    for (const p of paymentsResult.data || []) {
      paymentsByOrder[p.repair_order_id] = (paymentsByOrder[p.repair_order_id] || 0) + Number(p.amount || 0)
    }
    for (const o of techResult.data || []) {
      techByOrder[o.id] = o.organization_members?.profiles?.full_name || ''
    }
  }

  const header = csvRow([
    'Order #', 'Quote ID', 'Customer Name', 'Email',
    'Device', 'Repair Type', 'Status', 'Priority',
    'Technician', 'Due Date', 'Total Paid', 'Created',
  ])
  const rows = [header]

  for (const o of orders || []) {
    const q = o.quote_requests || {}
    const customerName = o.customers
      ? [o.customers.first_name, o.customers.last_name].filter(Boolean).join(' ')
      : [q.first_name, q.last_name].filter(Boolean).join(' ')
    const email = o.customers?.email || q.guest_email || ''
    const device = [q.brand_name, q.model_name].filter(Boolean).join(' ')
    const repairType = (q.repair_type_key || '').replace(/_/g, ' ')

    rows.push(csvRow([
      o.order_number || '',
      q.quote_id || '',
      customerName,
      email,
      device,
      repairType,
      o.current_status || '',
      o.priority || 'normal',
      techByOrder[o.id] || '',
      fmtDate(o.due_at),
      fmtAmount(paymentsByOrder[o.id] || 0),
      fmtDate(o.created_at),
    ]))
  }

  const date = fmtDate(new Date().toISOString())
  return csvResponse(rows, `orders-${date}.csv`)
}
