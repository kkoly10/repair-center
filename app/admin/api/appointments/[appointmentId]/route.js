import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionContext } from '../../../../../lib/admin/getSessionOrgId'
import { VALID_APPOINTMENT_STATUSES } from '../../../../../lib/admin/appointmentStatuses'

export const runtime = 'nodejs'

export async function PATCH(request, context) {
  let orgId, userId
  try {
    ;({ orgId, userId } = await getSessionContext())
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

  // Verify ownership — always fetch full row for convert action
  const { data: existing, error: lookupError } = await supabase
    .from('appointments')
    .select('id, status, first_name, last_name, email, phone, brand_name, model_name, repair_description, customer_id')
    .eq('id', appointmentId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 })

  // ── Convert appointment to walk-in repair order ────────────────────────────
  if (body.action === 'convert') {
    if (existing.status === 'converted') {
      return NextResponse.json({ error: 'Appointment already converted to an order.' }, { status: 409 })
    }

    try {
      const now = new Date().toISOString()
      const { first_name, last_name, email, phone, brand_name, model_name, repair_description } = existing

      // 1. Customer upsert: prefer existing customer_id on appointment
      let customerId = existing.customer_id || null

      if (!customerId && phone?.trim()) {
        const { data: byPhone } = await supabase
          .from('customers')
          .select('id')
          .eq('organization_id', orgId)
          .eq('phone', phone.trim())
          .maybeSingle()
        if (byPhone) customerId = byPhone.id
      }

      if (!customerId && email?.trim()) {
        const { data: byEmail } = await supabase
          .from('customers')
          .select('id')
          .eq('organization_id', orgId)
          .eq('email', email.trim().toLowerCase())
          .maybeSingle()
        if (byEmail) customerId = byEmail.id
      }

      if (!customerId) {
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert({
            organization_id: orgId,
            first_name: first_name?.trim(),
            last_name: last_name?.trim() || null,
            email: email?.trim().toLowerCase() || null,
            phone: phone?.trim() || null,
          })
          .select('id')
          .single()
        if (insertErr) throw insertErr
        customerId = newCustomer.id
      }

      // 2. Insert quote_request
      const deviceDescription = [brand_name, model_name].filter(Boolean).join(' ') || 'Device'
      const repairLabel = repair_description || 'Repair'

      const { data: quoteRequest, error: qrErr } = await supabase
        .from('quote_requests')
        .insert({
          organization_id: orgId,
          customer_id: customerId,
          guest_email: email?.trim().toLowerCase() || null,
          guest_phone: phone?.trim() || null,
          first_name: first_name?.trim(),
          last_name: last_name?.trim() || null,
          brand_name: brand_name?.trim() || null,
          model_name: model_name?.trim() || null,
          issue_description: repair_description || '',
          submission_source: 'walk_in',
          status: 'approved',
          reviewed_by_user_id: userId,
          reviewed_at: now,
          quote_summary: `Appointment walk-in: ${deviceDescription} — ${repairLabel}`,
        })
        .select('*')
        .single()
      if (qrErr) throw qrErr

      // 3. Insert repair_order
      const { data: order, error: orderErr } = await supabase
        .from('repair_orders')
        .insert({
          organization_id: orgId,
          quote_request_id: quoteRequest.id,
          customer_id: customerId,
          current_status: 'received',
          intake_received_at: now,
          notes: `Converted from appointment (${appointmentId})`,
        })
        .select('id, order_number')
        .single()
      if (orderErr) throw orderErr

      // 4. Mark appointment as converted
      await supabase
        .from('appointments')
        .update({ status: 'converted', quote_request_id: quoteRequest.id })
        .eq('id', appointmentId)
        .eq('organization_id', orgId)

      return NextResponse.json({
        ok: true,
        quoteId: quoteRequest.quote_id,
        orderId: order.id,
        orderNumber: order.order_number,
        appointmentId,
      })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Conversion failed.' },
        { status: 500 }
      )
    }
  }

  // ── Normal field update ────────────────────────────────────────────────────
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
