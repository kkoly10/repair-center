import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { notFound } from 'next/navigation'
import BookingPage from '../../../../components/BookingPage'

export default async function Page({ params }) {
  const { orgSlug } = await params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, status')
    .eq('slug', orgSlug)
    .maybeSingle()

  if (!org || org.status !== 'active') notFound()

  return <BookingPage orgSlug={orgSlug} orgName={org.name} />
}
