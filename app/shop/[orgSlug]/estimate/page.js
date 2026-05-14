import { Suspense } from 'react'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getCustomerSession } from '../../../../lib/customer/getCustomerSession'
import EstimateForm from '../../../../components/EstimateForm'

export default async function ShopEstimatePage({ params }) {
  const { orgSlug } = await params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, status')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .maybeSingle()

  const session = org ? await getCustomerSession(org.id).catch(() => null) : null
  const prefillContact = session?.customer ? {
    firstName: session.customer.first_name || '',
    lastName:  session.customer.last_name  || '',
    email:     session.customer.email      || '',
    phone:     session.customer.phone      || '',
  } : null

  return (
    <Suspense fallback={<div className='page-hero'><div className='site-shell'><p>Loading estimate form…</p></div></div>}>
      <EstimateForm orgSlug={orgSlug} prefillContact={prefillContact} />
    </Suspense>
  )
}
