import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { data: orders, error: ordersError } = await supabase
      .from('repair_orders')
      .select(`
        id,
        order_number,
        current_status,
        created_at,
        updated_at,
        quote_request_id,
        quote_requests (
          id,
          quote_id,
          model_name,
          repair_type_key,
          selected_pricing_rule_id,
          pricing_rules (
            id,
            turnaround_days,
            repair_types (
              repair_name,
              repair_key
            )
          )
        )
      `)
      .eq('organization_id', orgId)

    if (ordersError) throw ordersError

    const now = new Date()
    const overdueOrders = []
    const stuckOrders = []
    const completedTurnarounds = []
    const terminalStatuses = new Set([
      'shipped', 'delivered', 'cancelled', 'declined',
      'returned_unrepaired', 'beyond_economical_repair', 'no_fault_found',
    ])
    // Statuses that should not count toward SLA turnaround averages
    const notRepairedStatuses = new Set(['cancelled', 'declined', 'returned_unrepaired', 'beyond_economical_repair', 'no_fault_found'])
    const fortyEightHoursMs = 48 * 60 * 60 * 1000
    let totalOrders = 0
    let onTimeOrders = 0

    for (const order of orders || []) {
      const pricingRule = order.quote_requests?.pricing_rules
      const turnaroundDays = pricingRule?.turnaround_days || null
      const repairName = pricingRule?.repair_types?.repair_name || order.quote_requests?.repair_type_key || 'Unknown'
      const repairKey = pricingRule?.repair_types?.repair_key || order.quote_requests?.repair_type_key || 'unknown'
      const createdAt = new Date(order.created_at)
      const updatedAt = new Date(order.updated_at || order.created_at)
      const isTerminal = terminalStatuses.has(order.current_status)

      // Check for overdue orders (non-terminal, past expected turnaround)
      if (turnaroundDays && !isTerminal) {
        const expectedCompletion = new Date(createdAt.getTime() + turnaroundDays * 24 * 60 * 60 * 1000)
        if (now > expectedCompletion) {
          const overdueDays = Math.floor((now - expectedCompletion) / (24 * 60 * 60 * 1000))
          overdueOrders.push({
            orderId: order.id,
            orderNumber: order.order_number,
            currentStatus: order.current_status,
            repairType: repairName,
            expectedCompletionDate: expectedCompletion.toISOString(),
            overdueDays,
          })
        }
      }

      // Check for orders stuck in same status for >48h (non-terminal)
      if (!isTerminal) {
        const timeSinceUpdate = now - updatedAt
        if (timeSinceUpdate > fortyEightHoursMs) {
          stuckOrders.push({
            orderId: order.id,
            orderNumber: order.order_number,
            currentStatus: order.current_status,
            repairType: repairName,
            lastUpdated: updatedAt.toISOString(),
            hoursInStatus: Math.floor(timeSinceUpdate / (60 * 60 * 1000)),
          })
        }
      }

      // Track completed order turnaround for averages
      if (isTerminal && !notRepairedStatuses.has(order.current_status)) {
        const turnaroundMs = updatedAt - createdAt
        const turnaroundActualDays = turnaroundMs / (24 * 60 * 60 * 1000)
        completedTurnarounds.push({
          repairKey,
          repairName,
          days: turnaroundActualDays,
        })

        totalOrders++
        if (turnaroundDays && turnaroundActualDays <= turnaroundDays) {
          onTimeOrders++
        } else if (!turnaroundDays) {
          // No turnaround target; count as on-time by default
          onTimeOrders++
        }
      }
    }

    // Calculate average turnaround by repair type
    const turnaroundByType = {}
    for (const entry of completedTurnarounds) {
      if (!turnaroundByType[entry.repairKey]) {
        turnaroundByType[entry.repairKey] = {
          repairName: entry.repairName,
          totalDays: 0,
          count: 0,
        }
      }
      turnaroundByType[entry.repairKey].totalDays += entry.days
      turnaroundByType[entry.repairKey].count++
    }

    const averageTurnaround = Object.entries(turnaroundByType).map(([repairKey, data]) => ({
      repairKey,
      repairName: data.repairName,
      averageDays: Math.round((data.totalDays / data.count) * 10) / 10,
      completedOrders: data.count,
    }))

    const compliancePercentage = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 1000) / 10 : 100

    return NextResponse.json({
      generatedAt: now.toISOString(),
      slaCompliance: {
        percentage: compliancePercentage,
        onTimeOrders,
        totalCompletedOrders: totalOrders,
      },
      overdueOrders: {
        count: overdueOrders.length,
        orders: overdueOrders,
      },
      stuckOrders: {
        count: stuckOrders.length,
        orders: stuckOrders,
      },
      averageTurnaround,
    })
  } catch (error) {
    console.error('[sla] API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate SLA report.' },
      { status: 500 }
    )
  }
}
