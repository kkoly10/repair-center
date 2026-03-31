// Promo codes and returning customer discount logic

const PROMO_CODES = {
  WELCOME10: { type: 'percent', value: 10, description: '10% off your first repair', maxUses: null, minOrderValue: 50 },
  RETURN15: { type: 'percent', value: 15, description: '15% returning customer discount', maxUses: null, minOrderValue: 75 },
  SAVE20: { type: 'fixed', value: 20, description: '$20 off any repair over $100', maxUses: 500, minOrderValue: 100 },
  FREESHIP: { type: 'shipping', value: 0, description: 'Free return shipping', maxUses: null, minOrderValue: 0 },
}

export function validatePromoCode(code, orderValue = 0) {
  const normalized = (code || '').trim().toUpperCase()
  const promo = PROMO_CODES[normalized]

  if (!promo) return { valid: false, error: 'Invalid promo code.' }
  if (promo.minOrderValue && orderValue < promo.minOrderValue) {
    return { valid: false, error: `Minimum order value of $${promo.minOrderValue} required.` }
  }

  return { valid: true, promo: { code: normalized, ...promo } }
}

export function calculateDiscount(promo, orderValue, shippingFee) {
  if (!promo) return { discount: 0, shippingDiscount: 0 }

  if (promo.type === 'percent') {
    return { discount: Math.round(orderValue * (promo.value / 100) * 100) / 100, shippingDiscount: 0 }
  }
  if (promo.type === 'fixed') {
    return { discount: Math.min(promo.value, orderValue), shippingDiscount: 0 }
  }
  if (promo.type === 'shipping') {
    return { discount: 0, shippingDiscount: shippingFee }
  }

  return { discount: 0, shippingDiscount: 0 }
}

export async function getReturningCustomerDiscount(supabase, email) {
  if (!supabase || !email) return null

  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (!customer) return null

    const { count } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id)
      .in('status', ['approved_for_mail_in', 'archived'])

    if ((count || 0) >= 1) {
      return {
        code: 'LOYALTY',
        type: 'percent',
        value: 10,
        description: 'Returning customer discount (10% off)',
        automatic: true,
      }
    }

    return null
  } catch {
    return null
  }
}
