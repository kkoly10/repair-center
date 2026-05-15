/**
 * Returns Stripe Connect destination charge params for a given org,
 * or null if the org is not using Stripe Connect or is not yet ready.
 *
 * Used by payment intent routes to conditionally inject transfer_data
 * and application_fee_amount into PaymentIntent creation.
 */
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
