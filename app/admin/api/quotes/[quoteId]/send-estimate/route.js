import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getDefaultOrgId } from '../../../../../../lib/admin/org'
import { sendEstimateSentNotification } from '../../../../../../lib/notifications'

export const runtime = 'nodejs'

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId
    const body = await request.json()

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const normalizedItems = Array.isArray(body.items)
      ? body.items
          .map((item) => ({
            line_type: item?.line_type || 'labor',
            description: (item?.description || '').toString().trim(),
            quantity: Number(item?.quantity || 0),
            unit_amount: Number(item?.unit_amount || 0),
          }))
          .filter((item) => item.description && item.quantity > 0)
      : []

    if (!normalizedItems.length) {
      return NextResponse.json({ error: 'At least one valid line item is required.' }, { status: 400 })
    }

    const estimateKind = ['preliminary', 'final', 'revised'].includes(body.estimateKind)
      ? body.estimateKind
      : 'preliminary'

    const shippingAmount = safeMoney(body.shippingAmount)
    const taxAmount = safeMoney(body.taxAmount)
    const discountAmount = safeMoney(body.discountAmount)
    const depositCreditAmount = safeMoney(body.depositCreditAmount)
    const warrantyDays = Number(body.warrantyDays || 0)
    const turnaroundNote = (body.turnaroundNote || '').toString().trim()
    const customerVisibleNotes = (body.customerVisibleNotes || '').toString().trim()
    const internalNotes = (body.internalNotes || '').toString().trim()

    const subtotalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_amount,
      0
    )

    const totalAmount =
      subtotalAmount +
      shippingAmount +
      taxAmount -
      discountAmount -
      depositCreditAmount

    const orgId = await getDefaultOrgId()

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id, quote_id, customer_id, status, reviewed_by_user_id')
      .eq('quote_id', quoteId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    const { error: supersededError } = await supabase
      .from('quote_estimates')
      .update({ status: 'superseded' })
      .eq('quote_request_id', quoteRequest.id)
      .not('status', 'in', '("draft","superseded","declined")')

    if (supersededError) throw supersededError

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    const { data: estimate, error: estimateError } = await supabase
      .from('quote_estimates')
      .insert({
        organization_id: orgId,
        quote_request_id: quoteRequest.id,
        estimate_kind: estimateKind,
        status: 'sent',
        subtotal_amount: subtotalAmount,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        deposit_credit_amount: depositCreditAmount,
        total_amount: totalAmount,
        warranty_days: warrantyDays || null,
        turnaround_note: turnaroundNote || null,
        customer_visible_notes: customerVisibleNotes || null,
        internal_notes: internalNotes || null,
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (estimateError) throw estimateError

    const lineItemsPayload = normalizedItems.map((item) => ({
      estimate_id: estimate.id,
      line_type: item.line_type,
      description: item.description,
      quantity: item.quantity,
      unit_amount: item.unit_amount,
      line_total: item.quantity * item.unit_amount,
    }))

    if (shippingAmount > 0) {
      lineItemsPayload.push({
        estimate_id: estimate.id,
        line_type: 'shipping',
        description: 'Return shipping',
        quantity: 1,
        unit_amount: shippingAmount,
        line_total: shippingAmount,
      })
    }

    if (discountAmount > 0) {
      lineItemsPayload.push({
        estimate_id: estimate.id,
        line_type: 'discount',
        description: 'Discount',
        quantity: 1,
        unit_amount: -discountAmount,
        line_total: -discountAmount,
      })
    }

    if (depositCreditAmount > 0) {
      lineItemsPayload.push({
        estimate_id: estimate.id,
        line_type: 'credit',
        description: 'Deposit credit',
        quantity: 1,
        unit_amount: -depositCreditAmount,
        line_total: -depositCreditAmount,
      })
    }

    if (taxAmount > 0) {
      lineItemsPayload.push({
        estimate_id: estimate.id,
        line_type: 'fee',
        description: 'Tax',
        quantity: 1,
        unit_amount: taxAmount,
        line_total: taxAmount,
      })
    }

    const { error: itemsError } = await supabase
      .from('quote_estimate_items')
      .insert(lineItemsPayload)

    if (itemsError) throw itemsError

    const { error: quoteUpdateError } = await supabase
      .from('quote_requests')
      .update({
        status: 'estimate_sent',
        quote_summary: customerVisibleNotes || null,
        internal_notes: internalNotes || null,
        reviewed_at: new Date().toISOString(),
        preliminary_price_fixed: Number.isFinite(totalAmount) ? totalAmount : null,
        preliminary_price_min: null,
        preliminary_price_max: null,
      })
      .eq('id', quoteRequest.id)

    if (quoteUpdateError) throw quoteUpdateError

    try {
      await sendEstimateSentNotification({
        supabase,
        quoteRequestId: quoteRequest.id,
        estimateId: estimate.id,
        estimateKind,
        totalAmount,
      })
    } catch (notificationError) {
      console.error('[send-estimate] failed to send estimate notification:', notificationError)
    }

    return NextResponse.json({
      ok: true,
      estimateId: estimate.id,
      totalAmount,
      status: 'estimate_sent',
      reviewPath: `/estimate-review/${quoteId}`,
      trackingPath: `/track/${quoteId}`,
      mailInPath: null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create estimate.' },
      { status: 500 }
    )
  }
}

function safeMoney(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}
