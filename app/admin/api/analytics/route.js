import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

function rangeToIso(range) {
  const now = Date.now()
  if (range === '7d') return new Date(now - 7 * 86400000).toISOString()
  if (range === '30d') return new Date(now - 30 * 86400000).toISOString()
  if (range === '90d') return new Date(now - 90 * 86400000).toISOString()
  if (range === '12m') return new Date(now - 365 * 86400000).toISOString()
  return null // 'all'
}

export async function GET(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const rangeStart = rangeToIso(range)

    // Previous period: same duration ending at rangeStart (for trend comparison)
    const prevStart = rangeStart
      ? new Date(new Date(rangeStart).getTime() - (Date.now() - new Date(rangeStart).getTime())).toISOString()
      : null

    const [
      paidResult,
      prevResult,
      ordersResult,
      quotesResult,
      funnelResult,
      prevFunnelResult,
      recentResult,
      membersResult,
      customersResult,
    ] = await Promise.all([
      // Paid payments in selected range
      (() => {
        let q = supabase
          .from('payments')
          .select('id, payment_kind, amount, repair_order_id')
          .eq('organization_id', orgId)
          .eq('status', 'paid')
        if (rangeStart) q = q.gte('created_at', rangeStart)
        return q.order('created_at', { ascending: false })
      })(),

      // Previous period payments (for trend — amount only)
      prevStart
        ? supabase
            .from('payments')
            .select('amount')
            .eq('organization_id', orgId)
            .eq('status', 'paid')
            .gte('created_at', prevStart)
            .lt('created_at', rangeStart)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),

      // All repair orders (active count, turnaround, collection rates, repeat rate)
      supabase
        .from('repair_orders')
        .select('id, current_status, customer_id, assigned_technician_user_id, quote_request_id, intake_received_at, shipped_at')
        .eq('organization_id', orgId)
        .limit(5000)
        .order('created_at', { ascending: false }),

      // All quote requests — for device popularity, repair type demand, and join lookup
      supabase
        .from('quote_requests')
        .select('id, status, device_category, brand_name, model_name, repair_type_key')
        .eq('organization_id', orgId)
        .limit(10000)
        .order('created_at', { ascending: false }),

      // Range-filtered quote requests — for period-specific funnel metrics
      (() => {
        let q = supabase
          .from('quote_requests')
          .select('id, status')
          .eq('organization_id', orgId)
        if (rangeStart) q = q.gte('created_at', rangeStart)
        return q.order('created_at', { ascending: false })
      })(),

      // Previous period quote requests — for trend comparison on Total Quotes
      prevStart
        ? supabase
            .from('quote_requests')
            .select('id')
            .eq('organization_id', orgId)
            .gte('created_at', prevStart)
            .lt('created_at', rangeStart)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),

      // Recent 10 quotes for activity feed
      supabase
        .from('quote_requests')
        .select('id, quote_id, first_name, last_name, device_category, brand_name, model_name, repair_type_key, status, created_at')
        .eq('organization_id', orgId)
        .limit(10)
        .order('created_at', { ascending: false }),

      // Org members for technician name lookup
      supabase
        .from('organization_members')
        .select('user_id, profiles(full_name)')
        .eq('organization_id', orgId)
        .order('user_id', { ascending: true }),

      // Customers for repeat rate
      supabase
        .from('customers')
        .select('id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
    ])

    if (paidResult.error) throw paidResult.error
    if (prevResult.error) throw prevResult.error
    if (ordersResult.error) throw ordersResult.error
    if (quotesResult.error) throw quotesResult.error
    if (funnelResult.error) throw funnelResult.error
    if (prevFunnelResult.error) throw prevFunnelResult.error
    if (recentResult.error) throw recentResult.error
    if (membersResult.error) throw membersResult.error
    if (customersResult.error) throw customersResult.error

    const paidPayments = paidResult.data || []
    const repairOrders = ordersResult.data || []
    const quotes = quotesResult.data || []

    // Build lookup maps for join operations
    const orderById = Object.fromEntries(repairOrders.map((o) => [o.id, o]))
    const repairTypeById = Object.fromEntries(quotes.map((q) => [q.id, q.repair_type_key]))
    const techNameById = Object.fromEntries(
      (membersResult.data || [])
        .filter((m) => m.profiles?.full_name)
        .map((m) => [m.user_id, m.profiles.full_name])
    )

    // --- Revenue Metrics ---
    const totalRevenue = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
    const depositRevenue = paidPayments
      .filter((p) => p.payment_kind === 'inspection_deposit')
      .reduce((s, p) => s + Number(p.amount || 0), 0)
    const balanceRevenue = paidPayments
      .filter((p) => p.payment_kind === 'final_balance')
      .reduce((s, p) => s + Number(p.amount || 0), 0)
    const prevRevenue = (prevResult.data || []).reduce((s, p) => s + Number(p.amount || 0), 0)

    // --- Revenue by Repair Type ---
    const byTypeMap = {}
    for (const p of paidPayments) {
      if (!p.repair_order_id) continue
      const order = orderById[p.repair_order_id]
      if (!order) continue
      const type = repairTypeById[order.quote_request_id] || 'unknown'
      byTypeMap[type] = (byTypeMap[type] || 0) + Number(p.amount || 0)
    }
    const revenueByType = Object.entries(byTypeMap)
      .map(([repairType, amount]) => ({ repairType, amount }))
      .sort((a, b) => b.amount - a.amount)

    // --- Revenue by Technician ---
    const byTechMap = {}
    for (const p of paidPayments) {
      if (!p.repair_order_id) continue
      const order = orderById[p.repair_order_id]
      if (!order?.assigned_technician_user_id) continue
      const name = techNameById[order.assigned_technician_user_id] || 'Unassigned'
      byTechMap[name] = (byTechMap[name] || 0) + Number(p.amount || 0)
    }
    const revenueByTech = Object.entries(byTechMap)
      .map(([tech, amount]) => ({ tech, amount }))
      .sort((a, b) => b.amount - a.amount)

    // --- Collection Rates (deposits and balances vs all orders) ---
    const depositOrderIds = new Set(
      paidPayments
        .filter((p) => p.payment_kind === 'inspection_deposit' && p.repair_order_id)
        .map((p) => p.repair_order_id)
    )
    const balanceOrderIds = new Set(
      paidPayments
        .filter((p) => p.payment_kind === 'final_balance' && p.repair_order_id)
        .map((p) => p.repair_order_id)
    )
    const totalOrders = repairOrders.length
    const depositRate = totalOrders > 0 ? Math.round((depositOrderIds.size / totalOrders) * 1000) / 10 : 0
    const balanceRate = totalOrders > 0 ? Math.round((balanceOrderIds.size / totalOrders) * 1000) / 10 : 0

    // --- Conversion Funnel (period-specific) ---
    const periodQuotes = funnelResult.data || []
    const prevPeriodQuotes = prevFunnelResult.data || []
    const totalQuotes = periodQuotes.length
    const prevTotalQuotes = prevPeriodQuotes.length
    const statusCounts = {}
    for (const q of periodQuotes) {
      statusCounts[q.status] = (statusCounts[q.status] || 0) + 1
    }
    const estimatesSent = (statusCounts.estimate_sent || 0)
      + (statusCounts.awaiting_customer || 0)
      + (statusCounts.approved_for_mail_in || 0)
      + (statusCounts.declined || 0)
      + (statusCounts.archived || 0)

    // --- Repair Metrics ---
    const TERMINAL = new Set([
      'shipped', 'delivered', 'cancelled', 'declined',
      'returned_unrepaired', 'beyond_economical_repair', 'no_fault_found',
    ])
    const repairStatusCounts = {}
    let activeRepairs = 0
    for (const o of repairOrders) {
      repairStatusCounts[o.current_status] = (repairStatusCounts[o.current_status] || 0) + 1
      if (!TERMINAL.has(o.current_status)) activeRepairs++
    }

    // Average turnaround: intake → shipped (computed from fetched orders)
    const withDates = repairOrders.filter((o) => o.intake_received_at && o.shipped_at)
    let avgTurnaroundDays = null
    if (withDates.length > 0) {
      const totalDays = withDates.reduce(
        (s, o) => s + (new Date(o.shipped_at) - new Date(o.intake_received_at)) / 86400000,
        0
      )
      avgTurnaroundDays = Math.round((totalDays / withDates.length) * 10) / 10
    }

    // --- Device Popularity ---
    const deviceMap = {}
    for (const q of quotes) {
      const key = [q.brand_name, q.model_name].filter(Boolean).join(' ') || q.device_category || 'Unknown'
      deviceMap[key] = (deviceMap[key] || 0) + 1
    }
    const devicePopularity = Object.entries(deviceMap)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // --- Repair Type Demand (quote volume, all-time) ---
    const repairTypeMap = {}
    for (const q of quotes) {
      const key = q.repair_type_key || 'unknown'
      repairTypeMap[key] = (repairTypeMap[key] || 0) + 1
    }
    const repairTypeDemand = Object.entries(repairTypeMap)
      .map(([repairType, count]) => ({ repairType, count }))
      .sort((a, b) => b.count - a.count)

    // --- Repeat Customer Rate ---
    const totalCustomers = (customersResult.data || []).length
    const ordersByCustomer = {}
    for (const o of repairOrders) {
      if (!o.customer_id) continue
      ordersByCustomer[o.customer_id] = (ordersByCustomer[o.customer_id] || 0) + 1
    }
    const repeatCustomerCount = Object.values(ordersByCustomer).filter((n) => n > 1).length
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomerCount / totalCustomers) * 1000) / 10 : 0

    // --- Recent Quotes ---
    const recentQuotes = (recentResult.data || []).map((q) => ({
      quote_id: q.quote_id,
      customer: [q.first_name, q.last_name].filter(Boolean).join(' ') || 'Guest',
      device: [q.brand_name, q.model_name].filter(Boolean).join(' ') || q.device_category || 'Unknown',
      repair: q.repair_type_key || 'N/A',
      status: q.status,
      created_at: q.created_at,
    }))

    return NextResponse.json({
      ok: true,
      range,
      revenue: {
        total: totalRevenue,
        prev: prevRevenue,
        deposits: depositRevenue,
        balances: balanceRevenue,
        totalPayments: paidPayments.length,
        depositRate,
        balanceRate,
      },
      revenueByType,
      revenueByTech,
      funnel: {
        totalQuotes,
        prevTotalQuotes,
        estimatesSent,
        approved: statusCounts.approved_for_mail_in || 0,
        declined: statusCounts.declined || 0,
      },
      repairs: {
        avgTurnaroundDays,
        activeRepairs,
        totalOrders,
        statusCounts: repairStatusCounts,
      },
      devicePopularity,
      repairTypeDemand,
      recentQuotes,
      customers: { total: totalCustomers, repeatCustomers: repeatCustomerCount, repeatRate },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load analytics.' },
      { status: 500 }
    )
  }
}
