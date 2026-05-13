import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { resolveTrackingIdentifier } from '../../../../lib/resolveTrackingIdentifier'
import { verifyToken } from '../../../../lib/hmacToken'

export const runtime = 'nodejs'

async function resolveOrgId(supabase, orgSlug) {
  if (!orgSlug) return null
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .maybeSingle()
  return data?.id || null
}

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const identifier = params?.quoteId
    const body = await request.json()
    const email = (body?.email || '').toString().trim().toLowerCase()
    const orgSlug = (body?.orgSlug || '').toString().trim()
    const tok = (body?.tok || '').toString().trim()

    if (!verifyToken(identifier, tok)) {
      return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 403 })
    }

    if (!identifier || !email) {
      return NextResponse.json(
        { error: 'Tracking identifier and email are required.' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(supabase, orgSlug)
    const pathPrefix = orgId ? `/shop/${orgSlug}` : ''

    const resolved = await resolveTrackingIdentifier(identifier, { supabase, orgId })
    const quoteRequest = resolved.quoteRequest
    const repairOrder = resolved.repairOrder

    if (!quoteRequest) {
      return NextResponse.json(
        { error: 'Quote request not found.' },
        { status: 404 }
      )
    }

    const [customerResult, estimateResult] = await Promise.all([
      quoteRequest.customer_id
        ? supabase
            .from('customers')
            .select('id, first_name, last_name, email, phone')
            .eq('id', quoteRequest.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('quote_estimates')
        .select(
          'id, estimate_kind, status, total_amount, turnaround_note, warranty_days, sent_at, approved_at, declined_at'
        )
        .eq('quote_request_id', quoteRequest.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (customerResult.error) throw customerResult.error
    if (estimateResult.error) throw estimateResult.error

    const allowedEmails = [quoteRequest.guest_email, customerResult.data?.email]
      .filter(Boolean)
      .map((value) => value.toLowerCase())

    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { error: 'Email does not match this repair request.' },
        { status: 403 }
      )
    }

    let statusHistory = []
    let shipments = []
    let messages = []
    let depositPaid = false

    if (repairOrder?.id) {
      const [historyResult, shipmentsResult, messagesResult, paymentsResult] = await Promise.all([
        supabase
          .from('repair_order_status_history')
          .select('id, previous_status, new_status, customer_visible, note, created_at')
          .eq('repair_order_id', repairOrder.id)
          .eq('customer_visible', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('shipments')
          .select(
            'id, shipment_type, carrier, service_level, tracking_number, tracking_url, status, shipped_at, delivered_at, note'
          )
          .eq('repair_order_id', repairOrder.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('repair_messages')
          .select('id, sender_role, body, internal_only, created_at, customer_read_at, staff_read_at')
          .eq('repair_order_id', repairOrder.id)
          .eq('internal_only', false)
          .order('created_at', { ascending: true }),
        supabase
          .from('payments')
          .select('id, payment_kind, status')
          .eq('repair_order_id', repairOrder.id)
          .eq('payment_kind', 'inspection_deposit')
          .eq('status', 'paid')
          .limit(1),
      ])

      if (historyResult.error) throw historyResult.error
      if (shipmentsResult.error) throw shipmentsResult.error
      if (messagesResult.error) throw messagesResult.error
      if (paymentsResult.error) throw paymentsResult.error

      statusHistory = historyResult.data || []
      shipments = shipmentsResult.data || []
      messages = messagesResult.data || []
      depositPaid = (paymentsResult.data || []).length > 0

      const unreadVisibleStaffMessages = messages
        .filter(
          (message) =>
            ['admin', 'tech', 'system'].includes(message.sender_role) &&
            message.customer_read_at == null
        )
        .map((message) => message.id)

      if (unreadVisibleStaffMessages.length) {
        await supabase
          .from('repair_messages')
          .update({ customer_read_at: new Date().toISOString() })
          .in('id', unreadVisibleStaffMessages)
      }
    }

    return NextResponse.json({
      ok: true,
      identifier: resolved.identifier,
      canonicalQuoteId: resolved.canonicalQuoteId,
      canonicalOrderNumber: resolved.canonicalOrderNumber,
      quote: {
        quote_id: quoteRequest.quote_id,
        status: quoteRequest.status,
        brand_name: quoteRequest.brand_name,
        model_name: quoteRequest.model_name,
        repair_type_key: quoteRequest.repair_type_key,
        issue_description: quoteRequest.issue_description,
        quote_summary: quoteRequest.quote_summary,
        created_at: quoteRequest.created_at,
      },
      customer: {
        name: [
          customerResult.data?.first_name || quoteRequest.first_name,
          customerResult.data?.last_name || quoteRequest.last_name,
        ]
          .filter(Boolean)
          .join(' '),
        email: customerResult.data?.email || quoteRequest.guest_email,
        phone: customerResult.data?.phone || quoteRequest.guest_phone,
      },
      estimate: estimateResult.data,
      order: repairOrder
        ? {
            id: repairOrder.id,
            order_number: repairOrder.order_number,
            current_status: repairOrder.current_status,
            inspection_deposit_required: repairOrder.inspection_deposit_required,
            intake_received_at: repairOrder.intake_received_at,
            repair_started_at: repairOrder.repair_started_at,
            repair_completed_at: repairOrder.repair_completed_at,
            shipped_at: repairOrder.shipped_at,
            delivered_at: repairOrder.delivered_at,
          }
        : null,
      statusHistory,
      shipments,
      messages,
      depositPaid,
      depositRequired: repairOrder ? Number(repairOrder.inspection_deposit_required || 0) > 0 : false,
      paymentPath: `/pay/${quoteRequest.quote_id}`,
      balancePaymentPath: `/pay/${quoteRequest.quote_id}/balance`,
      mailInPath:
        (repairOrder &&
          ['awaiting_mail_in', 'in_transit_to_shop'].includes(repairOrder.current_status)) ||
        (!repairOrder && quoteRequest.status === 'approved_for_mail_in')
          ? `${pathPrefix}/mail-in/${quoteRequest.quote_id}`
          : null,
      reviewPath: `${pathPrefix}/estimate-review/${quoteRequest.quote_id}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load repair tracking.',
      },
      { status: 500 }
    )
  }
}
