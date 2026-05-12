import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getDefaultOrgId } from '../../../../../../lib/admin/org'
import {
  sendRepairStatusNotification,
  sendShipmentNotification,
} from '../../../../../../lib/notifications'

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

export async function GET(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const orgId = await getDefaultOrgId()

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    const [customerResult, orderResult, techniciansResult] = await Promise.all([
      quoteRequest.customer_id
        ? supabase
            .from('customers')
            .select('id, first_name, last_name, email, phone')
            .eq('id', quoteRequest.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('repair_orders')
        .select('*')
        .eq('quote_request_id', quoteRequest.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'tech'])
        .order('full_name', { ascending: true }),
    ])

    if (customerResult.error) throw customerResult.error
    if (orderResult.error) throw orderResult.error
    if (techniciansResult.error) throw techniciansResult.error

    let history = []
    let shipments = []

    if (orderResult.data?.id) {
      const [historyResult, shipmentsResult] = await Promise.all([
        supabase
          .from('repair_order_status_history')
          .select('id, repair_order_id, previous_status, new_status, customer_visible, note, created_at')
          .eq('repair_order_id', orderResult.data.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('shipments')
          .select('*')
          .eq('repair_order_id', orderResult.data.id)
          .order('created_at', { ascending: false }),
      ])

      if (historyResult.error) throw historyResult.error
      if (shipmentsResult.error) throw shipmentsResult.error

      history = historyResult.data || []
      shipments = shipmentsResult.data || []
    }

    return NextResponse.json({
      ok: true,
      quote: {
        id: quoteRequest.id,
        quote_id: quoteRequest.quote_id,
        status: quoteRequest.status,
        brand_name: quoteRequest.brand_name,
        model_name: quoteRequest.model_name,
        repair_type_key: quoteRequest.repair_type_key,
        issue_description: quoteRequest.issue_description,
        quote_summary: quoteRequest.quote_summary,
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
      order: orderResult.data,
      history,
      shipments,
      technicians: techniciansResult.data || [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load repair order.',
      },
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

    const newStatus = (body?.status || '').toString().trim()
    const customerNote = (body?.customerNote || '').toString().trim()
    const carrier = (body?.carrier || '').toString().trim()
    const serviceLevel = (body?.serviceLevel || '').toString().trim()
    const trackingNumber = (body?.trackingNumber || '').toString().trim()
    const trackingUrl = (body?.trackingUrl || '').toString().trim()
    const shipmentStatus = (body?.shipmentStatus || '').toString().trim()
    const hasTechnicianId = body !== null && 'technicianId' in body
    const technicianId = hasTechnicianId
      ? ((body.technicianId || '').toString().trim() || null)
      : undefined
    const hasTechnicianNote = body !== null && 'technicianNote' in body
    const technicianNote = hasTechnicianNote
      ? ((body.technicianNote || '').toString().trim() || null)
      : undefined

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid repair order status.' }, { status: 400 })
    }

    const RETURN_WITHOUT_REPAIR = new Set([
      'returned_unrepaired',
      'beyond_economical_repair',
      'no_fault_found',
    ])

    if (RETURN_WITHOUT_REPAIR.has(newStatus) && !trackingNumber) {
      return NextResponse.json(
        {
          error:
            'A return tracking number is required when marking an order as returned without repair.',
        },
        { status: 400 }
      )
    }

    const orgId = await getDefaultOrgId()

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    let { data: repairOrder, error: orderLookupError } = await supabase
      .from('repair_orders')
      .select('*')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (orderLookupError) throw orderLookupError

    const previousStatus = repairOrder?.current_status || null

    if (repairOrder && ['ready_to_ship', 'shipped'].includes(newStatus)) {
      const { data: latestEstimate, error: estimateError } = await supabase
        .from('quote_estimates')
        .select('id, total_amount')
        .eq('quote_request_id', quoteRequest.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (estimateError) throw estimateError

      const { data: paidPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('repair_order_id', repairOrder.id)
        .eq('status', 'paid')

      if (paymentsError) throw paymentsError

      const totalPaid = (paidPayments || []).reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      )

      const finalBalanceDue = Math.max(
        Number(latestEstimate?.total_amount || 0) - totalPaid,
        0
      )

      if (finalBalanceDue > 0) {
        return NextResponse.json(
          {
            error:
              'Final balance is still unpaid. Request or collect the remaining balance before moving this order to ready to ship or shipped.',
          },
          { status: 400 }
        )
      }
    }

    if (!repairOrder) {
      const [modelResult, repairTypeResult] = await Promise.all([
        quoteRequest.model_key
          ? supabase
              .from('repair_catalog_models')
              .select('id')
              .eq('model_key', quoteRequest.model_key)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        quoteRequest.repair_type_key
          ? supabase
              .from('repair_types')
              .select('id')
              .eq('repair_key', quoteRequest.repair_type_key)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

      if (modelResult.error) throw modelResult.error
      if (repairTypeResult.error) throw repairTypeResult.error

      const { data: insertedOrder, error: insertOrderError } = await supabase
        .from('repair_orders')
        .insert({
          organization_id: orgId,
          quote_request_id: quoteRequest.id,
          customer_id: quoteRequest.customer_id,
          model_id: modelResult.data?.id || null,
          repair_type_id: repairTypeResult.data?.id || null,
          current_status: newStatus,
          ...(hasTechnicianId ? { assigned_technician_user_id: technicianId } : {}),
          ...(hasTechnicianNote ? { technician_note: technicianNote } : {}),
        })
        .select('*')
        .single()

      if (insertOrderError) throw insertOrderError
      repairOrder = insertedOrder
    } else {
      const nowIso = new Date().toISOString()
      const updatePayload = {
        current_status: newStatus,
        ...(hasTechnicianId ? { assigned_technician_user_id: technicianId } : {}),
        ...(hasTechnicianNote ? { technician_note: technicianNote } : {}),
      }

      if (newStatus === 'received' && !repairOrder.intake_received_at) {
        updatePayload.intake_received_at = nowIso
      }

      if (newStatus === 'repairing' && !repairOrder.repair_started_at) {
        updatePayload.repair_started_at = nowIso
      }

      if (newStatus === 'testing' && !repairOrder.repair_completed_at) {
        updatePayload.repair_completed_at = nowIso
      }

      if (newStatus === 'shipped' && !repairOrder.shipped_at) {
        updatePayload.shipped_at = nowIso
      }

      if (newStatus === 'delivered' && !repairOrder.delivered_at) {
        updatePayload.delivered_at = nowIso
      }

      const { data: updatedOrder, error: updateOrderError } = await supabase
        .from('repair_orders')
        .update(updatePayload)
        .eq('id', repairOrder.id)
        .select('*')
        .single()

      if (updateOrderError) throw updateOrderError
      repairOrder = updatedOrder
    }

    let latestHistoryId = null
    let latestHistoryStatus = null

    const { data: historyRows, error: historyLookupError } = await supabase
      .from('repair_order_status_history')
      .select('id, new_status')
      .eq('repair_order_id', repairOrder.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (historyLookupError) throw historyLookupError

    latestHistoryId = historyRows?.[0]?.id || null
    latestHistoryStatus = historyRows?.[0]?.new_status || null

    if (latestHistoryId && customerNote) {
      const { error: updateHistoryError } = await supabase
        .from('repair_order_status_history')
        .update({
          note: customerNote,
          customer_visible: true,
        })
        .eq('id', latestHistoryId)

      if (updateHistoryError) throw updateHistoryError
    }

    let shipmentId = null

    if (trackingNumber || carrier || trackingUrl || shipmentStatus || newStatus === 'shipped') {
      const { data: existingShipment, error: shipmentLookupError } = await supabase
        .from('shipments')
        .select('*')
        .eq('repair_order_id', repairOrder.id)
        .eq('shipment_type', 'return')
        .maybeSingle()

      if (shipmentLookupError) throw shipmentLookupError

      const shipmentPayload = {
        organization_id: orgId,
        repair_order_id: repairOrder.id,
        shipment_type: 'return',
        carrier: carrier || null,
        service_level: serviceLevel || null,
        tracking_number: trackingNumber || null,
        tracking_url: trackingUrl || null,
        status: shipmentStatus || (newStatus === 'shipped' ? 'shipped' : null),
        shipped_at:
          newStatus === 'shipped'
            ? new Date().toISOString()
            : existingShipment?.shipped_at || null,
      }

      if (existingShipment) {
        const { error: updateShipmentError } = await supabase
          .from('shipments')
          .update(shipmentPayload)
          .eq('id', existingShipment.id)

        if (updateShipmentError) throw updateShipmentError
        shipmentId = existingShipment.id
      } else {
        const { data: insertedShipment, error: insertShipmentError } = await supabase
          .from('shipments')
          .insert(shipmentPayload)
          .select('id')
          .single()

        if (insertShipmentError) throw insertShipmentError
        shipmentId = insertedShipment.id
      }
    }

    if (newStatus === 'received' || newStatus === 'inspection') {
      const { error: quoteUpdateError } = await supabase
        .from('quote_requests')
        .update({ status: 'approved_for_mail_in' })
        .eq('id', quoteRequest.id)

      if (quoteUpdateError) throw quoteUpdateError
    }

    const shouldNotifyStatus =
      Boolean(customerNote) &&
      latestHistoryId &&
      latestHistoryStatus === newStatus &&
      previousStatus !== newStatus

    if (shouldNotifyStatus) {
      try {
        await sendRepairStatusNotification({
          supabase,
          quoteRequestId: quoteRequest.id,
          repairOrderId: repairOrder.id,
          historyId: latestHistoryId,
          status: newStatus,
          note: customerNote,
        })
      } catch (notificationError) {
        console.error('[order] failed to send repair status notification:', notificationError)
      }
    }

    if (newStatus === 'shipped' && trackingNumber && shipmentId) {
      try {
        await sendShipmentNotification({
          supabase,
          quoteRequestId: quoteRequest.id,
          repairOrderId: repairOrder.id,
          shipmentId,
          carrier: carrier || null,
          trackingNumber,
          trackingUrl: trackingUrl || null,
        })
      } catch (notificationError) {
        console.error('[order] failed to send shipment notification:', notificationError)
      }
    }

    return NextResponse.json({
      ok: true,
      orderNumber: repairOrder.order_number,
      currentStatus: repairOrder.current_status,
      mailInPath: `/mail-in/${quoteId}`,
      trackingPath: `/track/${quoteId}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update repair order.',
      },
      { status: 500 }
    )
  }
}