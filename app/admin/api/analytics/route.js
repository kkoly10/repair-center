import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

    // Run all queries in parallel
    const [
      paymentsResult,
      recentPaymentsResult,
      currentPeriodResult,
      previousPeriodResult,
      quoteStatusesResult,
      repairOrdersResult,
      devicePopularityResult,
      repairTypesResult,
      recentQuotesResult,
      turnaroundResult,
    ] = await Promise.all([
      // All paid payments
      supabase
        .from('payments')
        .select('id, amount, payment_kind, paid_at')
        .eq('status', 'paid'),

      // Recent 10 payments
      supabase
        .from('payments')
        .select('id, amount, payment_kind, status, paid_at, currency')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(10),

      // Current 30-day revenue
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', thirtyDaysAgo),

      // Previous 30-day revenue
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', sixtyDaysAgo)
        .lt('paid_at', thirtyDaysAgo),

      // Quote statuses
      supabase
        .from('quote_requests')
        .select('status')
        .limit(10000),

      // Repair orders
      supabase
        .from('repair_orders')
        .select('id, current_status, intake_received_at, repair_completed_at')
        .limit(10000),

      // Device popularity
      supabase
        .from('quote_requests')
        .select('device_category, brand_name, model_name')
        .limit(10000),

      // Repair types
      supabase
        .from('quote_requests')
        .select('repair_type_key')
        .limit(10000),

      // Recent 10 quotes
      supabase
        .from('quote_requests')
        .select('id, quote_id, first_name, last_name, guest_email, device_category, brand_name, model_name, repair_type_key, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Turnaround - completed repairs with both dates
      supabase
        .from('repair_orders')
        .select('intake_received_at, repair_completed_at')
        .not('intake_received_at', 'is', null)
        .not('repair_completed_at', 'is', null),
    ])

    // --- Revenue Metrics ---
    const payments = paymentsResult.data || []
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const depositRevenue = payments
      .filter((p) => p.payment_kind === 'inspection_deposit')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const balanceRevenue = payments
      .filter((p) => p.payment_kind === 'final_balance')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const totalPayments = payments.length

    const currentPeriodRevenue = (currentPeriodResult.data || []).reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    )
    const previousPeriodRevenue = (previousPeriodResult.data || []).reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    )

    // --- Conversion Funnel ---
    const quoteStatuses = quoteStatusesResult.data || []
    const totalQuotes = quoteStatuses.length
    const statusCounts = {}
    for (const row of quoteStatuses) {
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1
    }

    const estimatesSent = (statusCounts['estimate_sent'] || 0) +
      (statusCounts['awaiting_customer'] || 0) +
      (statusCounts['approved_for_mail_in'] || 0) +
      (statusCounts['declined'] || 0) +
      (statusCounts['archived'] || 0)
    const approved = statusCounts['approved_for_mail_in'] || 0
    const declined = statusCounts['declined'] || 0

    // --- Repair Metrics ---
    const repairOrders = repairOrdersResult.data || []
    const repairStatusCounts = {}
    let activeRepairs = 0
    for (const order of repairOrders) {
      repairStatusCounts[order.current_status] = (repairStatusCounts[order.current_status] || 0) + 1
      if (order.current_status !== 'completed' && order.current_status !== 'cancelled') {
        activeRepairs++
      }
    }

    // Average turnaround
    const completedWithDates = turnaroundResult.data || []
    let avgTurnaroundDays = null
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, order) => {
        const intake = new Date(order.intake_received_at)
        const completed = new Date(order.repair_completed_at)
        return sum + (completed - intake) / (1000 * 60 * 60 * 24)
      }, 0)
      avgTurnaroundDays = Math.round((totalDays / completedWithDates.length) * 10) / 10
    }

    // --- Device Popularity ---
    const deviceRows = devicePopularityResult.data || []
    const deviceMap = {}
    for (const row of deviceRows) {
      const key = [row.device_category, row.brand_name, row.model_name].filter(Boolean).join(' | ')
      deviceMap[key] = (deviceMap[key] || 0) + 1
    }
    const devicePopularity = Object.entries(deviceMap)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // --- Repair Type Demand ---
    const repairTypeRows = repairTypesResult.data || []
    const repairTypeMap = {}
    for (const row of repairTypeRows) {
      const key = row.repair_type_key || 'unknown'
      repairTypeMap[key] = (repairTypeMap[key] || 0) + 1
    }
    const repairTypeDemand = Object.entries(repairTypeMap)
      .map(([repairType, count]) => ({ repairType, count }))
      .sort((a, b) => b.count - a.count)

    // --- Recent Activity ---
    const recentQuotes = (recentQuotesResult.data || []).map((q) => ({
      quote_id: q.quote_id,
      customer: [q.first_name, q.last_name].filter(Boolean).join(' ') || 'Guest',
      device: [q.brand_name, q.model_name].filter(Boolean).join(' ') || q.device_category || 'Unknown',
      repair: q.repair_type_key || 'N/A',
      status: q.status,
      created_at: q.created_at,
    }))

    const recentPayments = (recentPaymentsResult.data || []).map((p) => ({
      id: p.id,
      amount: Number(p.amount || 0),
      kind: p.payment_kind,
      paid_at: p.paid_at,
    }))

    return NextResponse.json({
      ok: true,
      revenue: {
        totalRevenue,
        depositRevenue,
        balanceRevenue,
        totalPayments,
        currentPeriodRevenue,
        previousPeriodRevenue,
      },
      funnel: {
        totalQuotes,
        estimatesSent,
        approved,
        declined,
        statusCounts,
      },
      repairs: {
        avgTurnaroundDays,
        activeRepairs,
        totalOrders: repairOrders.length,
        statusCounts: repairStatusCounts,
      },
      devicePopularity,
      repairTypeDemand,
      recentQuotes,
      recentPayments,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load analytics.' },
      { status: 500 }
    )
  }
}
