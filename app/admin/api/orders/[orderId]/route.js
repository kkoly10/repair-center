import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionContext } from '../../../../../lib/admin/getSessionOrgId'
import { sendRepairStatusNotification } from '../../../../../lib/notifications'

export const runtime = 'nodejs'

const ALLOWED_STATUSES = [
  'awaiting_mail_in',
  'in_transit_to_shop',
  'received',
  'inspection',
  'awaiting_final_approval',
  'approved',
  'waiting_parts',
  'repairing',
  'testing',
  'awaiting_balance_payment',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'declined',
  'returned_unrepaired',
  'beyond_economical_repair',
  'no_fault_found',
]

const ALLOWED_PRIORITIES = ['low', 'normal', 'high', 'urgent']

// Statuses that warrant a customer-facing notification email + SMS
const CUSTOMER_NOTIFY_STATUSES = new Set([
  'inspection',
  'repairing',
  'awaiting_balance_payment',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'returned_unrepaired',
  'beyond_economical_repair',
  'no_fault_found',
])

export async function PATCH(request, context) {
  let orgId, userId
  try {
    ;({ orgId, userId } = await getSessionContext())
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const orderId = params?.orderId

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID.' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    // Verify org ownership before any mutation
    const { data: order, error: fetchError } = await supabase
      .from('repair_orders')
      .select('id, order_number, current_status, priority, due_at, notes, assigned_technician_user_id, quote_request_id, intake_received_at, repair_started_at, repair_completed_at, shipped_at, delivered_at')
      .eq('id', orderId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!order) {
      return NextResponse.json({ error: 'Repair order not found.' }, { status: 404 })
    }

    const updatePayload = {}
    const auditEntries = []
    const now = new Date().toISOString()
    let statusChanged = false
    let newStatus = null

    if ('status' in body) {
      newStatus = (body.status || '').toString().trim()
      if (!ALLOWED_STATUSES.includes(newStatus)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      updatePayload.current_status = newStatus
      statusChanged = newStatus !== order.current_status
      if (newStatus === 'received' && !order.intake_received_at) updatePayload.intake_received_at = now
      if (newStatus === 'repairing' && !order.repair_started_at) updatePayload.repair_started_at = now
      if (newStatus === 'testing' && !order.repair_completed_at) updatePayload.repair_completed_at = now
      if (newStatus === 'shipped' && !order.shipped_at) updatePayload.shipped_at = now
      if (newStatus === 'delivered' && !order.delivered_at) updatePayload.delivered_at = now
    }

    if ('assigned_technician_user_id' in body) {
      const newTechId = body.assigned_technician_user_id || null
      updatePayload.assigned_technician_user_id = newTechId
      auditEntries.push({
        organization_id: orgId,
        repair_order_id: orderId,
        actor_user_id: userId,
        event_type: 'technician_assigned',
        old_value: order.assigned_technician_user_id || null,
        new_value: newTechId,
      })
    }

    if ('priority' in body) {
      const newPriority = (body.priority || '').toString().trim()
      if (!ALLOWED_PRIORITIES.includes(newPriority)) {
        return NextResponse.json({ error: 'Invalid priority.' }, { status: 400 })
      }
      updatePayload.priority = newPriority
      auditEntries.push({
        organization_id: orgId,
        repair_order_id: orderId,
        actor_user_id: userId,
        event_type: 'priority_changed',
        old_value: order.priority || null,
        new_value: newPriority,
      })
    }

    if ('due_at' in body) {
      const newDueAt = body.due_at || null
      updatePayload.due_at = newDueAt
      auditEntries.push({
        organization_id: orgId,
        repair_order_id: orderId,
        actor_user_id: userId,
        event_type: 'due_date_changed',
        old_value: order.due_at || null,
        new_value: newDueAt,
      })
    }

    if ('notes' in body) {
      const newNotes = body.notes != null ? String(body.notes).trim() || null : null
      updatePayload.notes = newNotes
      auditEntries.push({
        organization_id: orgId,
        repair_order_id: orderId,
        actor_user_id: userId,
        event_type: 'note_updated',
        old_value: order.notes || null,
        new_value: newNotes,
      })
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('repair_orders')
      .update(updatePayload)
      .eq('id', orderId)
      .eq('organization_id', orgId)
      .select('id, order_number, current_status, priority, due_at, notes, assigned_technician_user_id')
      .single()

    if (updateError) throw updateError

    // Audit log — non-fatal: best-effort write
    if (auditEntries.length) {
      await supabase.from('repair_order_audit_log').insert(auditEntries)
    }

    // Customer notification on status change — fire-and-forget
    if (statusChanged && newStatus && CUSTOMER_NOTIFY_STATUSES.has(newStatus) && order.quote_request_id) {
      // Fetch latest status history entry (written by DB trigger) for dedup key
      const { data: historyRow } = await supabase
        .from('repair_order_status_history')
        .select('id')
        .eq('repair_order_id', orderId)
        .eq('new_status', newStatus)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      sendRepairStatusNotification({
        supabase,
        quoteRequestId: order.quote_request_id,
        repairOrderId: orderId,
        historyId: historyRow?.id || null,
        status: newStatus,
        note: null,
      }).catch((err) => {
        console.error('[orders-queue] status notification failed:', err)
      })
    }

    return NextResponse.json({ ok: true, order: updated })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update repair order.' },
      { status: 500 }
    )
  }
}
