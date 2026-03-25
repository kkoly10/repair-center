import { getSupabaseAdmin } from '../supabase/admin'

export async function getPaymentSummaryByQuoteId(quoteId) {
  const supabase = getSupabaseAdmin()

  const { data: quoteRequest, error: quoteError } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (quoteError) throw quoteError
  if (!quoteRequest) throw new Error('Quote request not found.')

  const [customerResult, repairOrderResult, latestEstimateResult] = await Promise.all([
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
      .select('*')
      .eq('quote_request_id', quoteRequest.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (customerResult.error) throw customerResult.error
  if (repairOrderResult.error) throw repairOrderResult.error
  if (latestEstimateResult.error) throw latestEstimateResult.error

  const repairOrder = repairOrderResult.data || null
  const latestEstimate = latestEstimateResult.data || null

  let payments = []
  if (repairOrder?.id) {
    const { data: paymentRows, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('repair_order_id', repairOrder.id)
      .order('created_at', { ascending: false })

    if (paymentsError) throw paymentsError
    payments = paymentRows || []
  }

  const paidPayments = payments.filter((payment) => payment.status === 'paid')
  const depositPayments = paidPayments.filter((payment) => payment.payment_kind === 'inspection_deposit')
  const finalBalancePayments = paidPayments.filter((payment) => payment.payment_kind === 'final_balance')

  const depositPaidAmount = depositPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const finalBalancePaidAmount = finalBalancePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalCollected = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const estimateTotal = Number(latestEstimate?.total_amount || 0)
  const depositRequired = Number(repairOrder?.inspection_deposit_required || 0)
  const finalBalanceDue = Math.max(estimateTotal - totalCollected, 0)

  return {
    quoteRequest,
    customer: customerResult.data || null,
    repairOrder,
    latestEstimate,
    payments,
    summary: {
      estimateTotal,
      depositRequired,
      depositPaidAmount,
      finalBalancePaidAmount,
      totalCollected,
      finalBalanceDue,
      depositPaid: depositRequired <= 0 ? true : depositPaidAmount >= depositRequired,
      finalBalancePaid: finalBalanceDue <= 0,
      paymentBlockedShipping:
        finalBalanceDue > 0 && ['awaiting_balance_payment', 'ready_to_ship'].includes(repairOrder?.current_status || ''),
    },
  }
}
