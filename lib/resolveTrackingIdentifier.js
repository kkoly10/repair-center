import { getSupabaseAdmin } from './supabase/admin'

export async function resolveTrackingIdentifier(identifier, options = {}) {
  const supabase = options.supabase || getSupabaseAdmin()
  const orgId = options.orgId || null
  const normalized = (identifier || '').toString().trim()

  if (!normalized) {
    throw new Error('Tracking identifier is required.')
  }

  let quoteRequest = null
  let repairOrder = null

  if (normalized.toUpperCase().startsWith('RCQ-')) {
    let q = supabase.from('quote_requests').select('*').eq('quote_id', normalized)
    if (orgId) q = q.eq('organization_id', orgId)
    const { data, error } = await q.maybeSingle()
    if (error) throw error
    quoteRequest = data || null
  } else if (normalized.toUpperCase().startsWith('RCO-')) {
    let q = supabase.from('repair_orders').select('*').eq('order_number', normalized)
    if (orgId) q = q.eq('organization_id', orgId)
    const { data, error } = await q.maybeSingle()
    if (error) throw error
    repairOrder = data || null

    if (repairOrder?.quote_request_id) {
      let qr = supabase.from('quote_requests').select('*').eq('id', repairOrder.quote_request_id)
      if (orgId) qr = qr.eq('organization_id', orgId)
      const { data: quoteData, error: quoteError } = await qr.maybeSingle()
      if (quoteError) throw quoteError
      quoteRequest = quoteData || null
    }
  } else {
    let q = supabase.from('quote_requests').select('*').eq('quote_id', normalized)
    if (orgId) q = q.eq('organization_id', orgId)
    const { data: quoteData, error: quoteError } = await q.maybeSingle()
    if (quoteError) throw quoteError
    quoteRequest = quoteData || null

    if (!quoteRequest) {
      let oq = supabase.from('repair_orders').select('*').eq('order_number', normalized)
      if (orgId) oq = oq.eq('organization_id', orgId)
      const { data: orderData, error: orderError } = await oq.maybeSingle()
      if (orderError) throw orderError
      repairOrder = orderData || null

      if (repairOrder?.quote_request_id) {
        let fq = supabase.from('quote_requests').select('*').eq('id', repairOrder.quote_request_id)
        if (orgId) fq = fq.eq('organization_id', orgId)
        const { data: fallbackQuote, error: fallbackQuoteError } = await fq.maybeSingle()
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
