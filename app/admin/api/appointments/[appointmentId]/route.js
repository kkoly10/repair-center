import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'
import { VALID_APPOINTMENT_STATUSES } from '../../../../../lib/admin/appointmentStatuses'

export const runtime = 'nodejs'

export async function PATCH(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()
  const params = await context.params
  const appointmentId = params?.appointmentId

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  // Verify ownership
  const { data: existing, error: lookupError } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 })

  const allowed = ['status', 'notes', 'preferred_at', 'cancellation_reason']
  const update = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key] === '' ? null : body[key]
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  if (update.status && !VALID_APPOINTMENT_STATUSES.includes(update.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  // Auto-set timestamps on status transitions
  if (update.status === 'confirmed' && existing.status !== 'confirmed') {
    update.confirmed_at = new Date().toISOString()
  }
  if (update.status === 'cancelled' && existing.status !== 'cancelled') {
    update.cancelled_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', appointmentId)
    .eq('organization_id', orgId)
    .select('id, first_name, last_name, email, phone, brand_name, model_name, repair_description, preferred_at, notes, status, confirmed_at, cancelled_at, cancellation_reason, quote_request_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 })

  return NextResponse.json({ ok: true, appointment: data })
}
