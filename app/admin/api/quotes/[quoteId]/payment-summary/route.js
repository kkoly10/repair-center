import { NextResponse } from 'next/server'
import { getPaymentSummaryByQuoteId } from '../../../../../../lib/payments/getPaymentSummary'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  try {
    const params = await context.params
    const quoteId = params?.quoteId

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const record = await getPaymentSummaryByQuoteId(quoteId, orgId)

    return NextResponse.json({
      ok: true,
      quote: {
        id: record.quoteRequest.id,
        quote_id: record.quoteRequest.quote_id,
        status: record.quoteRequest.status,
        brand_name: record.quoteRequest.brand_name,
        model_name: record.quoteRequest.model_name,
        repair_type_key: record.quoteRequest.repair_type_key,
      },
      repairOrder: record.repairOrder
        ? {
            id: record.repairOrder.id,
            order_number: record.repairOrder.order_number,
            current_status: record.repairOrder.current_status,
            inspection_deposit_required: record.repairOrder.inspection_deposit_required,
          }
        : null,
      latestEstimate: record.latestEstimate
        ? {
            id: record.latestEstimate.id,
            estimate_kind: record.latestEstimate.estimate_kind,
            status: record.latestEstimate.status,
            total_amount: record.latestEstimate.total_amount,
          }
        : null,
      summary: record.summary,
      payments: record.payments.map((payment) => ({
        id: payment.id,
        payment_kind: payment.payment_kind,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paid_at: payment.paid_at,
        provider_payment_intent_id: payment.provider_payment_intent_id,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load payment summary.' },
      { status: 500 }
    )
  }
}
