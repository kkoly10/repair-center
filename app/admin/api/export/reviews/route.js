import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'
import { csvRow, csvResponse, fmtDate } from '../../../../../lib/csvExport'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: reviews, error } = await supabase
    .from('repair_reviews')
    .select(`
      rating,
      comment,
      source,
      created_at,
      quote_requests(quote_id, first_name, last_name, brand_name, model_name, repair_type_key)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const header = csvRow(['Rating', 'Customer', 'Quote ID', 'Device', 'Repair Type', 'Comment', 'Source', 'Date'])
  const rows = [header]

  for (const r of reviews || []) {
    const q = r.quote_requests || {}
    rows.push(csvRow([
      r.rating,
      [q.first_name, q.last_name].filter(Boolean).join(' '),
      q.quote_id || '',
      [q.brand_name, q.model_name].filter(Boolean).join(' '),
      (q.repair_type_key || '').replace(/_/g, ' '),
      r.comment || '',
      r.source || '',
      fmtDate(r.created_at),
    ]))
  }

  const date = fmtDate(new Date().toISOString())
  return csvResponse(rows, `reviews-${date}.csv`)
}
