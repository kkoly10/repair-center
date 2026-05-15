// Returns Stripe Connect destination charge params, or null if org is not using Connect.
export async function getConnectParams(supabase, organizationId) {
  const { data } = await supabase
    .from('organization_payment_settings')
    .select('payment_mode, stripe_connect_account_id, stripe_connect_charges_enabled')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (
    data?.payment_mode === 'stripe_connect' &&
    data?.stripe_connect_account_id &&
    data?.stripe_connect_charges_enabled === true
  ) {
    const feePercent = parseFloat(process.env.STRIPE_CONNECT_PLATFORM_FEE_PERCENT || '0.0075')
    return { destination: data.stripe_connect_account_id, feePercent }
  }
  return null
}
