import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId
    const body = await request.json()
    const email = (body?.email || '').toString().trim().toLowerCase()

    if (!quoteId || !email) {
      return NextResponse.json(
        { error: 'Quote ID and email are required.' },
        { status: 400 }
      )
    }

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('quote_id', quoteId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json(
        { error: 'Quote request not found.' },
        { status: 404 }
      )
    }

    const [customerResult, orderResult, estimateResult] = await Promise.all([
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
        .from('quote_estimates')
        .select(
          'id, estimate_kind, status, total_amount, turnaround_note, warranty_days, sent_at, approved_at'
        )
        .eq('quote_request_id', quoteRequest.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (customerResult.error) throw customerResult.error
    if (orderResult.error) throw orderResult.error
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

    if (orderResult.data?.id) {
      const [historyResult, shipmentsResult] = await Promise.all([
        supabase
          .from('repair_order_status_history')
          .select(
            'id, previous_status, new_status, customer_visible, note, created_at'
          )
          .eq('repair_order_id', orderResult.data.id)
          .eq('customer_visible', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('shipments')
          .select(
            'id, shipment_type, carrier, service_level, tracking_number, tracking_url, status, shipped_at, delivered_at, note'
          )
          .eq('repair_order_id', orderResult.data.id)
          .order('created_at', { ascending: false }),
      ])

      if (historyResult.error) throw historyResult.error
      if (shipmentsResult.error) throw shipmentsResult.error

      statusHistory = historyResult.data || []
      shipments = shipmentsResult.data || []
    }

    return NextResponse.json({
      ok: true,
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
      order: orderResult.data
        ? {
            id: orderResult.data.id,
            order_number: orderResult.data.order_number,
            current_status: orderResult.data.current_status,
            inspection_deposit_required:
              orderResult.data.inspection_deposit_required,
            intake_received_at: orderResult.data.intake_received_at,
            repair_started_at: orderResult.data.repair_started_at,
            repair_completed_at: orderResult.data.repair_completed_at,
            shipped_at: orderResult.data.shipped_at,
            delivered_at: orderResult.data.delivered_at,
          }
        : null,
      statusHistory,
      shipments,
      mailInPath:
        quoteRequest.status === 'approved_for_mail_in' ||
        orderResult.data?.order_number
          ? `/mail-in/${quoteId}`
          : null,
      reviewPath: `/estimate-review/${quoteId}`,
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