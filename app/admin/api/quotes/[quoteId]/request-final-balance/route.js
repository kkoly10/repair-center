import { NextResponse } from 'next/server'
import { getPaymentSummaryByQuoteId } from '../../../../../../lib/payments/getPaymentSummary'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { sendFinalBalanceReadyNotification } from '../../../../../../lib/finalBalanceNotifications'

export const runtime = 'nodejs'

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const record = await getPaymentSummaryByQuoteId(quoteId)

    if (!record.repairOrder) {
      return NextResponse.json({ error: 'Repair order not found.' }, { status: 404 })
    }

    const amountDue = Number(record.summary.finalBalanceDue || 0)
    if (amountDue <= 0) {
      return NextResponse.json({ error: 'No final balance is due for this repair.' }, { status: 400 })
    }

    const nextStatus =
      record.repairOrder.current_status === 'shipped' || record.repairOrder.current_status === 'delivered'
        ? record.repairOrder.current_status
        : 'awaiting_balance_payment'

    const { error: orderUpdateError } = await supabase
      .from('repair_orders')
      .update({ current_status: nextStatus })
      .eq('id', record.repairOrder.id)

    if (orderUpdateError) throw orderUpdateError

    try {
      await sendFinalBalanceReadyNotification({
        supabase,
        quoteRequestId: record.quoteRequest.id,
        repairOrderId: record.repairOrder.id,
        amountDue,
        orderNumber: record.repairOrder.order_number || null,
      })
    } catch (notificationError) {
      console.error('[request-final-balance] notification failure:', notificationError)
    }

    return NextResponse.json({
      ok: true,
      amountDue,
      status: nextStatus,
      balancePath: `/pay/${quoteId}/balance`,
      trackingPath: `/track/${quoteId}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to request final balance.' },
      { status: 500 }
    )
  }
}
