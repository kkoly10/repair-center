import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getPlatformSession } from '../../../../lib/platform/getPlatformSession'

export const runtime = 'nodejs'

export async function GET(request) {
  try {
    await getPlatformSession()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 403 })
  }

  const supabase = getSupabaseAdmin()
  const url = new URL(request.url)
  const type = url.searchParams.get('type') || ''
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const perPage = 50
  const offset = (page - 1) * perPage

  let query = supabase
    .from('feedback')
    .select('id, type, message, email, page_url, organization_id, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (type && ['bug', 'feature', 'general'].includes(type)) {
    query = query.eq('type', type)
  }

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    feedback: data || [],
    total: count || 0,
    page,
    perPage,
  })
}
