import { notFound, redirect } from 'next/navigation'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getCustomerSession } from '../../../../lib/customer/getCustomerSession'
import CustomerAccountPage from '../../../../components/CustomerAccountPage'

export default async function ShopAccountPage({ params }) {
  const { orgSlug } = await params
  const supabase = getSupabaseAdmin()

  // 1. Resolve the org (404 if not found or inactive)
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (!org) notFound()

  // 2. Validate the customer session for this org
  const session = await getCustomerSession(org.id)
  if (!session) {
    redirect(`/shop/${orgSlug}/login`)
  }

  const { customer } = session

  // 3. Fetch this customer's quote requests and repair orders in parallel
  const [quotesResult, ordersResult] = await Promise.all([
    supabase
      .from('quote_requests')
      .select('id, quote_id, brand_name, model_name, repair_type_key, status, created_at')
      .eq('customer_id', customer.id)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('repair_orders')
      .select('quote_request_id, current_status')
      .eq('customer_id', customer.id)
      .eq('organization_id', org.id),
  ])

  const quotes = quotesResult.data || []
  const orders = ordersResult.data || []

  // Build a lookup from quote_request_id → order status
  const orderStatusByQuoteId = Object.fromEntries(
    orders.map((o) => [o.quote_request_id, o.current_status])
  )

  const enrichedQuotes = quotes.map((q) => ({
    quote_id: q.quote_id,
    quote_status: q.status,
    brand_name: q.brand_name,
    model_name: q.model_name,
    repair_type_key: q.repair_type_key,
    created_at: q.created_at,
    order_status: orderStatusByQuoteId[q.id] || null,
  }))

  return (
    <CustomerAccountPage
      customer={customer}
      quotes={enrichedQuotes}
      orgSlug={orgSlug}
    />
  )
}
