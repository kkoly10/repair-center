import { getSupabaseAdmin } from '../supabase/admin'

// Returns the ID of the oldest organization — used only as a fallback for
// legacy single-tenant routes that don't yet receive an orgSlug. No caching:
// caching the first org ID globally would break multi-tenant correctness.
export async function getDefaultOrgId() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error) throw new Error(`Failed to resolve organization: ${error.message}`)
  return data.id
}
