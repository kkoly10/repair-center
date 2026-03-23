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
    const action = (body?.action || 'view').toString().trim()

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

    const [customerResult, estimateResult, orderResult] = await Promise.all([
      quoteRequest.customer_id
        ? supabase
            .from('customers')
            .select(
              'id, first_name, last_name, email, phone, preferred_contact_method'
            )
            .eq('id', quoteRequest.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('quote_estimates')
        .select('*')
        .eq('quote_request_id', quoteRequest.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('repair_orders')
        .select('id, order_number, current_status')
        .eq('quote_request_id', quoteRequest.id)
        .maybeSingle(),
    ])

    if (customerResult.error) throw customerResult.error
    if (estimateResult.error) throw estimateResult.error
    if (orderResult.error) throw orderResult.error

    const allowedEmails = [quoteRequest.guest_email, customerResult.data?.email]
      .filter(Boolean)
      .map((value) => value.toLowerCase())

    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { error: 'Email does not match this estimate request.' },
        { status: 403 }
      )
    }

    const estimate = estimateResult.data
    if (!estimate) {
      return NextResponse.json(
        { error: 'No sent estimate is available for this quote yet.' },
        { status: 404 }
      )
    }

    const { data: estimateItems, error: itemsError } = await supabase
      .from('quote_estimate_items')
      .select('*')
      .eq('estimate_id', estimate.id)
      .order('created_at', { ascending: true })

    if (itemsError) throw itemsError

    if (action === 'approve') {
      const { error: estimateUpdateError } = await supabase
        .from('quote_estimates')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', estimate.id)

      if (estimateUpdateError) throw estimateUpdateError

      const { error: quoteUpdateError } = await supabase
        .from('quote_requests')
        .update({
          status: 'approved_for_mail_in',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', quoteRequest.id)

      if (quoteUpdateError) throw quoteUpdateError

      const [
        modelResult,
        repairTypeResult,
        pricingRuleResult,
        existingOrderResult,
      ] = await Promise.all([
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
        quoteRequest.selected_pricing_rule_id
          ? supabase
              .from('pricing_rules')
              .select('deposit_amount')
              .eq('id', quoteRequest.selected_pricing_rule_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from('repair_orders')
          .select('id, order_number')
          .eq('quote_request_id', quoteRequest.id)
          .maybeSingle(),
      ])

      if (modelResult.error) throw modelResult.error
      if (repairTypeResult.error) throw repairTypeResult.error
      if (pricingRuleResult.error) throw pricingRuleResult.error
      if (existingOrderResult.error) throw existingOrderResult.error

      let repairOrder = existingOrderResult.data

      if (!repairOrder) {
        const { data: insertedOrder, error: orderInsertError } = await supabase
          .from('repair_orders')
          .insert({
            quote_request_id: quoteRequest.id,
            customer_id: quoteRequest.customer_id,
            model_id: modelResult.data?.id || null,
            repair_type_id: repairTypeResult.data?.id || null,
            current_status: 'awaiting_mail_in',
            inspection_deposit_required:
              pricingRuleResult.data?.deposit_amount || 0,
            final_estimate_id: estimate.id,
          })
          .select('id, order_number')
          .single()

        if (orderInsertError) throw orderInsertError
        repairOrder = insertedOrder
      } else {
        const { error: orderUpdateError } = await supabase
          .from('repair_orders')
          .update({
            current_status: 'awaiting_mail_in',
            final_estimate_id: estimate.id,
          })
          .eq('id', repairOrder.id)

        if (orderUpdateError) throw orderUpdateError
      }

      return NextResponse.json({
        ok: true,
        action: 'approve',
        quoteId,
        estimateId: estimate.id,
        orderNumber: repairOrder?.order_number || null,
        quoteStatus: 'approved_for_mail_in',
        estimateStatus: 'approved',
        reviewPath: `/estimate-review/${quoteId}`,
        mailInPath: `/mail-in/${quoteId}`,
      })
    }

    if (action === 'decline') {
      const { error: estimateUpdateError } = await supabase
        .from('quote_estimates')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
        })
        .eq('id', estimate.id)

      if (estimateUpdateError) throw estimateUpdateError

      const { error: quoteUpdateError } = await supabase
        .from('quote_requests')
        .update({
          status: 'declined',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', quoteRequest.id)

      if (quoteUpdateError) throw quoteUpdateError

      return NextResponse.json({
        ok: true,
        action: 'decline',
        quoteId,
        estimateId: estimate.id,
        quoteStatus: 'declined',
        estimateStatus: 'declined',
        reviewPath: `/estimate-review/${quoteId}`,
      })
    }

    return NextResponse.json({
      ok: true,
      action: 'view',
      reviewPath: `/estimate-review/${quoteId}`,
      mailInPath:
        quoteRequest.status === 'approved_for_mail_in' ||
        orderResult.data?.order_number
          ? `/mail-in/${quoteId}`
          : null,
      orderNumber: orderResult.data?.order_number || null,
      quote: {
        quote_id: quoteRequest.quote_id,
        brand_name: quoteRequest.brand_name,
        model_name: quoteRequest.model_name,
        repair_type_key: quoteRequest.repair_type_key,
        issue_description: quoteRequest.issue_description,
        quote_summary: quoteRequest.quote_summary,
        status: quoteRequest.status,
      },
      customer: {
        name: [
          customerResult.data?.first_name || quoteRequest.first_name,
          customerResult.data?.last_name || quoteRequest.last_name,
        ]
          .filter(Boolean)
          .join(' '),
        email: customerResult.data?.email || quoteRequest.guest_email,
      },
      estimate: {
        id: estimate.id,
        estimate_kind: estimate.estimate_kind,
        status: estimate.status,
        subtotal_amount: estimate.subtotal_amount,
        shipping_amount: estimate.shipping_amount,
        tax_amount: estimate.tax_amount,
        discount_amount: estimate.discount_amount,
        deposit_credit_amount: estimate.deposit_credit_amount,
        total_amount: estimate.total_amount,
        warranty_days: estimate.warranty_days,
        turnaround_note: estimate.turnaround_note,
        customer_visible_notes: estimate.customer_visible_notes,
        sent_at: estimate.sent_at,
      },
      items: estimateItems || [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load estimate review.',
      },
      { status: 500 }
    )
  }
}