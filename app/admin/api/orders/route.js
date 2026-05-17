import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

const PAGE_SIZE = 25

const TERMINAL_STATUSES = [
  'shipped',
  'delivered',
  'cancelled',
  'declined',
  'returned_unrepaired',
  'beyond_economical_repair',
  'no_fault_found',
]

export async function GET(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const tech = searchParams.get('tech') || ''
    const search = (searchParams.get('search') || '').trim()
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10))
    const offset = page * PAGE_SIZE

    // Search pre-lookup: resolve quote_request_ids or customer_ids before the main query
    let searchQuoteRequestIds = null
    let searchCustomerIds = null

    if (search) {
      if (/^RCQ-/i.test(search)) {
        const { data: qrs } = await supabase
          .from('quote_requests')
          .select('id')
          .eq('organization_id', orgId)
          .ilike('quote_id', `%${search}%`)
          .limit(50)
        searchQuoteRequestIds = (qrs || []).map((r) => r.id)
        if (!searchQuoteRequestIds.length) {
          return NextResponse.json({ ok: true, orders: [], totalCount: 0, page })
        }
      } else if (!/^RCO-/i.test(search)) {
        const safeSearch = search.replace(/[,()"%]/g, ' ').replace(/\\/g, '\\\\').replace(/_/g, '\\_').trim()
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .eq('organization_id', orgId)
          .or(`first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`)
          .limit(100)
        searchCustomerIds = (customers || []).map((c) => c.id)
      }
    }

    let query = supabase
      .from('repair_orders')
      .select(
        `
        id, order_number, current_status, priority, due_at,
        inspection_deposit_required, inspection_deposit_paid_at,
        assigned_technician_user_id, created_at, updated_at,
        quote_requests!quote_request_id(
          id, quote_id, brand_name, model_name, repair_type_key
        ),
        customers!customer_id(
          first_name, last_name, email, phone
        ),
        profiles!assigned_technician_user_id(
          full_name
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    // Status / view filters
    if (status === 'overdue') {
      query = query
        .lt('due_at', new Date().toISOString())
        .not('current_status', 'in', `(${TERMINAL_STATUSES.join(',')})`)
    } else if (status === 'active') {
      query = query.not('current_status', 'in', `(${TERMINAL_STATUSES.join(',')})`)
    } else if (status === 'completed') {
      query = query.in('current_status', TERMINAL_STATUSES)
    } else if (status) {
      query = query.eq('current_status', status)
    }

    // Technician filter
    if (tech === 'unassigned') {
      query = query.is('assigned_technician_user_id', null)
    } else if (tech) {
      query = query.eq('assigned_technician_user_id', tech)
    }

    // Search filters
    if (search) {
      if (searchQuoteRequestIds) {
        query = query.in('quote_request_id', searchQuoteRequestIds)
      } else if (searchCustomerIds && searchCustomerIds.length) {
        query = query.in('customer_id', searchCustomerIds)
      } else if (searchCustomerIds && !searchCustomerIds.length) {
        query = query.ilike('order_number', `%${search}%`)
      } else {
        // RCO- style: filter by order_number
        query = query.ilike('order_number', `%${search}%`)
      }
    }

    const { data: orders, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      ok: true,
      orders: (orders || []).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        current_status: o.current_status,
        priority: o.priority,
        due_at: o.due_at,
        inspection_deposit_required: o.inspection_deposit_required,
        inspection_deposit_paid_at: o.inspection_deposit_paid_at,
        assigned_technician_user_id: o.assigned_technician_user_id,
        technician_name: o.profiles?.full_name || null,
        quote_id: o.quote_requests?.quote_id || null,
        quote_request_id: o.quote_requests?.id || null,
        brand_name: o.quote_requests?.brand_name || null,
        model_name: o.quote_requests?.model_name || null,
        repair_type_key: o.quote_requests?.repair_type_key || null,
        customer_name: [o.customers?.first_name, o.customers?.last_name].filter(Boolean).join(' ') || null,
        customer_email: o.customers?.email || null,
        customer_phone: o.customers?.phone || null,
        created_at: o.created_at,
        updated_at: o.updated_at,
      })),
      totalCount: count || 0,
      page,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load repair orders.' },
      { status: 500 }
    )
  }
}
