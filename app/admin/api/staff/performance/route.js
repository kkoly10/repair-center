import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

const TERMINAL_STATUSES = new Set([
  'shipped',
  'delivered',
  'cancelled',
  'declined',
  'returned_unrepaired',
  'beyond_economical_repair',
  'no_fault_found',
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const [membersResult, ordersResult] = await Promise.all([
      supabase
        .from('organization_members')
        .select('user_id, role, profiles(full_name)')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .in('role', ['owner', 'admin', 'tech'])
        .order('created_at', { ascending: true }),
      supabase
        .from('repair_orders')
        .select('id, assigned_technician_user_id, current_status, intake_received_at, shipped_at, delivered_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
    ])

    if (membersResult.error) throw membersResult.error
    if (ordersResult.error) throw ordersResult.error

    const orders = ordersResult.data || []

    const stats = (membersResult.data || []).map((m) => {
      const assigned = orders.filter((o) => o.assigned_technician_user_id === m.user_id)
      const active = assigned.filter((o) => !TERMINAL_STATUSES.has(o.current_status))
      const completedRecent = assigned.filter((o) => {
        const completedAt = o.shipped_at || o.delivered_at
        return completedAt >= thirtyDaysAgo && TERMINAL_STATUSES.has(o.current_status)
      })
      const withTurnaround = assigned.filter((o) => o.intake_received_at && o.shipped_at)
      const avgTurnaroundDays =
        withTurnaround.length > 0
          ? Math.round(
              (withTurnaround.reduce(
                (sum, o) =>
                  sum + (new Date(o.shipped_at) - new Date(o.intake_received_at)) / 86400000,
                0
              ) /
                withTurnaround.length) *
                10
            ) / 10
          : null

      return {
        user_id: m.user_id,
        full_name: m.profiles?.full_name || 'Unknown',
        role: m.role,
        total_assigned: assigned.length,
        active_assigned: active.length,
        completed_last_30d: completedRecent.length,
        avg_turnaround_days: avgTurnaroundDays,
      }
    })

    return NextResponse.json({ ok: true, stats })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load staff performance.' },
      { status: 500 }
    )
  }
}
