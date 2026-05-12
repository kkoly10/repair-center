import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { getDefaultOrgId } from '../../../lib/admin/org'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request) {
  const supabase = getSupabaseAdmin()

  try {
    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()
    const orgSlug = (body.orgSlug || '').toString().trim()

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email is required.' },
        { status: 400 }
      )
    }

    // Resolve org from slug if provided; fall back to default org for single-tenant setups
    let orgId
    if (orgSlug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .eq('status', 'active')
        .maybeSingle()
      if (org) orgId = org.id
    }
    if (!orgId) {
      orgId = await getDefaultOrgId()
    }

    // 1. Look up customer by email within this org (case-insensitive)
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('organization_id', orgId)
      .ilike('email', email)
      .limit(5)

    if (customerError) throw customerError

    const customer = (customers || []).find(
      (c) => (c.email || '').toLowerCase() === email
    )

    if (!customer) {
      return NextResponse.json({ ok: false, error: 'No account found' })
    }

    // 2. Query quote_requests scoped to this org where customer_id matches OR guest_email matches
    const { data: quotes, error: quotesError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('organization_id', orgId)
      .or(`customer_id.eq.${customer.id},guest_email.ilike.${email}`)
      .order('created_at', { ascending: false })

    if (quotesError) throw quotesError

    // 3. For each quote with a repair order, get the repair order details
    const quoteIds = (quotes || []).map((q) => q.id)

    let repairOrders = []
    if (quoteIds.length > 0) {
      const { data: orders, error: ordersError } = await supabase
        .from('repair_orders')
        .select('*')
        .in('quote_request_id', quoteIds)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError
      repairOrders = orders || []
    }

    // 4. Get all payments linked to those orders
    const orderIds = repairOrders.map((o) => o.id)

    let payments = []
    if (orderIds.length > 0) {
      const { data: paymentData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('repair_order_id', orderIds)
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError
      payments = paymentData || []
    }

    return NextResponse.json({
      ok: true,
      customer: {
        name: [customer.first_name, customer.last_name].filter(Boolean).join(' '),
        email: customer.email,
        phone: customer.phone,
      },
      quotes: quotes || [],
      repairOrders,
      payments,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected server error.',
      },
      { status: 500 }
    )
  }
}
