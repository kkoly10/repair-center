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

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()

  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] })
  }

  const supabase = getSupabaseAdmin()
  // Strip chars that break PostgREST or() filter syntax, then escape SQL LIKE wildcards
  const safeQ = q.replace(/[,()"%]/g, ' ').replace(/\\/g, '\\\\').replace(/_/g, '\\_').trim()
  const pattern = `%${safeQ}%`

  const [quotesResult, ordersResult, customersResult] = await Promise.all([
    // Quote requests: search by quote_id, first_name, last_name, email, brand_name, model_name
    supabase
      .from('quote_requests')
      .select('id, quote_id, first_name, last_name, guest_email, brand_name, model_name, repair_type_key, status, created_at')
      .eq('organization_id', orgId)
      .or(`quote_id.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},guest_email.ilike.${pattern},brand_name.ilike.${pattern},model_name.ilike.${pattern}`)
      .limit(5)
      .order('created_at', { ascending: false }),

    // Repair orders: search by order_number
    supabase
      .from('repair_orders')
      .select('id, order_number, current_status, created_at, quote_request_id')
      .eq('organization_id', orgId)
      .ilike('order_number', pattern)
      .limit(5)
      .order('created_at', { ascending: false }),

    // Customers: search by name, email, phone
    supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, created_at')
      .eq('organization_id', orgId)
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
      .limit(5)
      .order('created_at', { ascending: false }),
  ])

  const results = []

  for (const quote of quotesResult.data || []) {
    results.push({
      type: 'quote',
      id: quote.id,
      title: [quote.first_name, quote.last_name].filter(Boolean).join(' ') || quote.guest_email || 'Guest',
      subtitle: [quote.brand_name, quote.model_name].filter(Boolean).join(' ') || quote.repair_type_key || '',
      meta: quote.quote_id,
      status: quote.status,
      href: `/admin/quotes/${quote.quote_id}`,
      createdAt: quote.created_at,
    })
  }

  for (const order of ordersResult.data || []) {
    results.push({
      type: 'order',
      id: order.id,
      title: `Order #${order.order_number}`,
      subtitle: order.current_status?.replace(/_/g, ' ') || '',
      meta: order.order_number,
      status: order.current_status,
      href: `/admin/quotes/${order.quote_request_id}/order`,
      createdAt: order.created_at,
    })
  }

  for (const customer of customersResult.data || []) {
    results.push({
      type: 'customer',
      id: customer.id,
      title: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email || 'Customer',
      subtitle: customer.email || customer.phone || '',
      meta: '',
      status: null,
      href: `/admin/customers/${customer.id}`,
      createdAt: customer.created_at,
    })
  }

  // Sort by most recent
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return NextResponse.json({ ok: true, results, query: q })
}
