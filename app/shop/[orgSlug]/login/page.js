import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import CustomerLoginPage from '../../../../components/CustomerLoginPage'

export default async function ShopLoginPage({ params }) {
  const { orgSlug } = await params

  const { data: org } = await getSupabaseAdmin()
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (!org) notFound()

  return <CustomerLoginPage orgSlug={orgSlug} />
}
