import { getSupabaseAdmin } from './supabase/admin'

export async function resolveTrackingIdentifier(identifier, options = {}) {
  const supabase = options.supabase || getSupabaseAdmin()
  const normalized = (identifier || '').toString().trim()

  if (!normalized) {
    throw new Error('Tracking identifier is required.')
  }

  let quoteRequest = null
  let repairOrder = null

  if (normalized.toUpperCase().startsWith('RCQ-')) {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('quote_id', normalized)
      .maybeSingle()

    if (error) throw error
    quoteRequest = data || null
  } else if (normalized.toUpperCase().startsWith('RCO-')) {
    const { data, error } = await supabase
      .from('repair_orders')
      .select('*')
      .eq('order_number', normalized)
      .maybeSingle()

    if (error) throw error
    repairOrder = data || null

    if (repairOrder?.quote_request_id) {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', repairOrder.quote_request_id)
        .maybeSingle()

      if (quoteError) throw quoteError
      quoteRequest = quoteData || null
    }
  } else {
    const { data: quoteData, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('quote_id', normalized)
      .maybeSingle()

    if (quoteError) throw quoteError
    quoteRequest = quoteData || null

    if (!quoteRequest) {
      const { data: orderData, error: orderError } = await supabase
        .from('repair_orders')
        .select('*')
        .eq('order_number', normalized)
        .maybeSingle()

      if (orderError) throw orderError
      repairOrder = orderData || null

      if (repairOrder?.quote_request_id) {
        const { data: fallbackQuote, error: fallbackQuoteError } = await supabase
          .from('quote_requests')
          .select('*')
          .eq('id', repairOrder.quote_request_id)
          .maybeSingle()

        if (fallbackQuoteError) throw fallbackQuoteError
        quoteRequest = fallbackQuote || null
      }
    }
  }

  if (!quoteRequest) {
    return { quoteRequest: null, repairOrder: null, identifier: normalized }
  }

  if (!repairOrder) {
    const { data: orderData, error: orderError } = await supabase
      .from('repair_orders')
      .select('*')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (orderError) throw orderError
    repairOrder = orderData || null
  }

  return {
    identifier: normalized,
    quoteRequest,
    repairOrder,
    canonicalQuoteId: quoteRequest.quote_id,
    canonicalOrderNumber: repairOrder?.order_number || null,
  }
}
