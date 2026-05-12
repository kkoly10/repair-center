import { getSupabaseAdmin } from '../supabase/admin'

let _cachedOrgId = null

export async function getDefaultOrgId() {
  if (_cachedOrgId) return _cachedOrgId
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error) throw new Error(`Failed to resolve organization: ${error.message}`)
  _cachedOrgId = data.id
  return _cachedOrgId
}
