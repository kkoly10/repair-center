import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getCustomerSession } from '../../../../lib/customer/getCustomerSession'
import BookingPage from '../../../../components/BookingPage'

export default async function Page({ params }) {
  const { orgSlug } = await params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, status')
    .eq('slug', orgSlug)
    .maybeSingle()

  if (!org || org.status !== 'active') notFound()

  const session = await getCustomerSession(org.id).catch(() => null)
  const prefill = session?.customer ? {
    firstName: session.customer.first_name || '',
    lastName:  session.customer.last_name  || '',
    email:     session.customer.email      || '',
    phone:     session.customer.phone      || '',
  } : null

  return <BookingPage orgSlug={orgSlug} orgName={org.name} prefill={prefill} />
}
