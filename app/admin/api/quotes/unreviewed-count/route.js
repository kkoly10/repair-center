import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  const { count, error } = await supabase
    .from('quote_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'submitted')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
}
