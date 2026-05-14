import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../supabase/admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Resolves the authenticated customer for a given org.
 * Returns { user, customer } or null if unauthenticated / no customer row for this org.
 */
export async function getCustomerSession(orgId) {
  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},  // read-only in server components; middleware handles refresh
    },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: customer, error: customerError } = await getSupabaseAdmin()
    .from('customers')
    .select('id, first_name, last_name, email, phone, created_at')
    .eq('auth_user_id', user.id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (customerError || !customer) return null

  return { user, customer }
}
