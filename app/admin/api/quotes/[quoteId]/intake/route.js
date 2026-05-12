import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getDefaultOrgId } from '../../../../../../lib/admin/org'

export const runtime = 'nodejs'

export async function GET(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    const { data: repairOrder, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (orderError) throw orderError
    if (!repairOrder) {
      return NextResponse.json({ ok: true, intake: null })
    }

    const { data: intake, error: intakeError } = await supabase
      .from('device_intake_reports')
      .select('*')
      .eq('repair_order_id', repairOrder.id)
      .maybeSingle()

    if (intakeError) throw intakeError

    return NextResponse.json({ ok: true, intake })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load intake report.' },
      { status: 500 }
    )
  }
}

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId
    const body = await request.json()

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    const { data: repairOrder, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (orderError) throw orderError
    if (!repairOrder) {
      return NextResponse.json(
        { error: 'A repair order must exist before recording an intake report.' },
        { status: 400 }
      )
    }

    const orgId = await getDefaultOrgId()
    const payload = {
      organization_id: orgId,
      repair_order_id: repairOrder.id,
      package_condition: (body.packageCondition || '').toString().trim() || null,
      device_condition: (body.deviceCondition || '').toString().trim() || null,
      included_items: (body.includedItems || '').toString().trim() || null,
      imei_or_serial: (body.imeiOrSerial || '').toString().trim() || null,
      power_test_result: (body.powerTestResult || '').toString().trim() || null,
      intake_photos_complete: Boolean(body.intakePhotosComplete),
      hidden_damage_found: Boolean(body.hiddenDamageFound),
      liquid_damage_found: Boolean(body.liquidDamageFound),
      board_damage_found: Boolean(body.boardDamageFound),
      notes: (body.notes || '').toString().trim() || null,
    }

    const { data: existing, error: existingError } = await supabase
      .from('device_intake_reports')
      .select('id')
      .eq('repair_order_id', repairOrder.id)
      .maybeSingle()

    if (existingError) throw existingError

    let intake
    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('device_intake_reports')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (updateError) throw updateError
      intake = updated
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('device_intake_reports')
        .insert(payload)
        .select('*')
        .single()

      if (insertError) throw insertError
      intake = inserted
    }

    return NextResponse.json({ ok: true, intake })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save intake report.' },
      { status: 500 }
    )
  }
}
