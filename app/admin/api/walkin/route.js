import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionContext } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function POST(request) {
  let orgId, userId
  try {
    ;({ orgId, userId } = await getSessionContext())
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    category,
    brandName,
    modelName,
    modelKey,
    repairKey,
    repairDescription,
    issueDescription,
    agreedPrice,
    technicianId,
    internalNotes,
  } = body

  if (!firstName?.trim()) {
    return NextResponse.json({ error: 'firstName is required.' }, { status: 400 })
  }
  if (!phone?.trim() && !email?.trim()) {
    return NextResponse.json({ error: 'phone or email is required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()
  const deviceDescription = [brandName, modelName].filter(Boolean).join(' ') || 'Device'
  const repairLabel = repairDescription || repairKey || 'Repair'

  try {
    // ── 1. Customer upsert: phone first, then email, then insert new ───────────
    let customerId = null

    if (phone?.trim()) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', orgId)
        .eq('phone', phone.trim())
        .maybeSingle()
      if (existing) customerId = existing.id
    }

    if (!customerId && email?.trim()) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()
      if (existing) customerId = existing.id
    }

    if (!customerId) {
      const { data: newCustomer, error: insertErr } = await supabase
        .from('customers')
        .insert({
          organization_id: orgId,
          first_name: firstName.trim(),
          last_name: lastName?.trim() || null,
          email: email?.trim().toLowerCase() || null,
          phone: phone?.trim() || null,
        })
        .select('id')
        .single()
      if (insertErr) throw insertErr
      customerId = newCustomer.id
    }

    // ── 2. Optional catalog lookups ────────────────────────────────────────────
    const [modelResult, repairTypeResult] = await Promise.all([
      modelKey
        ? supabase.from('repair_catalog_models').select('id').eq('model_key', modelKey).maybeSingle()
        : Promise.resolve({ data: null }),
      repairKey
        ? supabase.from('repair_types').select('id').eq('repair_key', repairKey).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    const modelId = modelResult.data?.id || null
    const repairTypeId = repairTypeResult.data?.id || null

    // ── 3. Insert quote_request (DB generates quote_id) ────────────────────────
    const { data: quoteRequest, error: qrErr } = await supabase
      .from('quote_requests')
      .insert({
        organization_id: orgId,
        customer_id: customerId,
        guest_email: email?.trim().toLowerCase() || null,
        guest_phone: phone?.trim() || null,
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        device_category: category || 'phone',
        brand_name: brandName?.trim() || null,
        model_name: modelName?.trim() || null,
        model_key: modelKey || null,
        repair_type_key: repairKey || null,
        issue_description: issueDescription || repairDescription || '',
        submission_source: 'walk_in',
        status: 'approved',
        reviewed_by_user_id: userId,
        reviewed_at: now,
        quote_summary: `Walk-in: ${deviceDescription} — ${repairLabel}`,
      })
      .select('*')
      .single()
    if (qrErr) throw qrErr

    // ── 4. Insert repair_order (DB generates order_number) ─────────────────────
    const agreedPriceNum = agreedPrice ? parseFloat(agreedPrice) : null
    const priceNote = agreedPriceNum && !isNaN(agreedPriceNum) ? `Agreed price: $${agreedPriceNum.toFixed(2)}` : null
    const notesStr = [priceNote, internalNotes?.trim()].filter(Boolean).join('\n') || null

    const { data: order, error: orderErr } = await supabase
      .from('repair_orders')
      .insert({
        organization_id: orgId,
        quote_request_id: quoteRequest.id,
        customer_id: customerId,
        model_id: modelId,
        repair_type_id: repairTypeId,
        current_status: 'received',
        intake_received_at: now,
        assigned_technician_user_id: technicianId || null,
        notes: notesStr,
      })
      .select('id, order_number')
      .single()
    if (orderErr) throw orderErr

    return NextResponse.json({
      ok: true,
      quoteId: quoteRequest.quote_id,
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create walk-in order.' },
      { status: 500 }
    )
  }
}
