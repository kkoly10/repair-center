import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getCustomerSession } from '../../../../../lib/customer/getCustomerSession'
import CustomerTrackingPage from '../../../../../components/CustomerTrackingPage'

export default async function ShopTrackRoute({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams

  const supabase = getSupabaseAdmin()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, status')
    .eq('slug', resolvedParams.orgSlug)
    .eq('status', 'active')
    .maybeSingle()

  const session = org ? await getCustomerSession(org.id).catch(() => null) : null

  return (
    <CustomerTrackingPage
      quoteId={resolvedParams.quoteId}
      orgSlug={resolvedParams.orgSlug}
      tok={resolvedSearch?.tok || ''}
      prefillEmail={session?.customer?.email || ''}
    />
  )
}
