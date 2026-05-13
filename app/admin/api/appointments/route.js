import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'no_show', 'converted']

export async function GET(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('appointments')
    .select('id, first_name, last_name, email, phone, brand_name, model_name, repair_description, preferred_at, notes, status, confirmed_at, cancelled_at, cancellation_reason, quote_request_id, created_at')
    .eq('organization_id', orgId)
    .order('preferred_at', { ascending: true })

  if (status && VALID_STATUSES.includes(status)) query = query.eq('status', status)
  if (from) query = query.gte('preferred_at', from)
  if (to) query = query.lte('preferred_at', to)

  const { data: appointments, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, appointments: appointments || [] })
}
