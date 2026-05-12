import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../supabase/admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Resolves the organization_id for the currently authenticated admin user.
// Reads the session from request cookies (works in Next.js Route Handlers).
// Throws with a .status property (401 or 403) on auth/membership failure.
export async function getSessionOrgId() {
  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  const { data: membership, error: membershipError } = await getSupabaseAdmin()
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin', 'tech'])
    .maybeSingle()

  if (membershipError) throw new Error(`Membership lookup failed: ${membershipError.message}`)
  if (!membership) {
    const err = new Error('Forbidden: no active organization membership')
    err.status = 403
    throw err
  }

  return membership.organization_id
}
