import { getSupabaseAdmin } from '../supabase/admin'
import { sendFinalBalancePaidNotification } from '../finalBalancePaidNotifications'

export async function finalizeFinalBalancePayment({
  quoteRequestId,
  repairOrderId,
  estimateId,
  paymentIntentId,
  amount,
}) {
  const supabase = getSupabaseAdmin()

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from('payments')
    .select('id, repair_order_id')
    .eq('provider_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (existingPaymentError) throw existingPaymentError

  let resolvedRepairOrderId = repairOrderId

  if (!resolvedRepairOrderId) {
    const { data: repairOrder, error: repairOrderError } = await supabase
      .from('repair_orders')
      .select('id, order_number, current_status, quote_request_id')
      .eq('quote_request_id', quoteRequestId)
      .maybeSingle()

    if (repairOrderError) throw repairOrderError
    if (!repairOrder) {
      throw new Error('Repair order not found for final balance payment.')
    }

    resolvedRepairOrderId = repairOrder.id
  }

  const { data: repairOrder, error: orderError } = await supabase
    .from('repair_orders')
    .select('id, order_number, current_status, quote_request_id')
    .eq('id', resolvedRepairOrderId)
    .single()

  if (orderError) throw orderError

  if (existingPayment) {
    return {
      paymentId: existingPayment.id,
      repairOrderId: existingPayment.repair_order_id,
      existing: true,
      nextStatus: repairOrder.current_status,
    }
  }

  const { data: insertedPayment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      repair_order_id: resolvedRepairOrderId,
      quote_estimate_id: estimateId || null,
      payment_kind: 'final_balance',
      provider: 'stripe',
      provider_payment_intent_id: paymentIntentId,
      amount,
      currency: 'USD',
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (paymentError) throw paymentError

  const nextStatus =
    repairOrder.current_status === 'awaiting_balance_payment'
      ? 'ready_to_ship'
      : repairOrder.current_status

  const { error: updateOrderError } = await supabase
    .from('repair_orders')
    .update({ current_status: nextStatus })
    .eq('id', resolvedRepairOrderId)

  if (updateOrderError) throw updateOrderError

  try {
    await sendFinalBalancePaidNotification({
      supabase,
      quoteRequestId: quoteRequestId || repairOrder.quote_request_id,
      repairOrderId: resolvedRepairOrderId,
      paymentId: insertedPayment.id,
      amount,
      orderNumber: repairOrder.order_number || null,
    })
  } catch (notificationError) {
    console.error('[final-balance] paid notification failed:', notificationError)
  }

  return {
    paymentId: insertedPayment.id,
    repairOrderId: resolvedRepairOrderId,
    existing: false,
    nextStatus,
  }
}