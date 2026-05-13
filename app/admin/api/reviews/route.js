import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

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
      id,
      rating,
      comment,
      source,
      created_at,
      quote_requests(quote_id, first_name, last_name, brand_name, model_name, repair_type_key)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = reviews || []
  const total = rows.length
  const avgRating = total > 0
    ? rows.reduce((sum, r) => sum + r.rating, 0) / total
    : 0

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of rows) distribution[r.rating] = (distribution[r.rating] || 0) + 1

  return NextResponse.json({
    ok: true,
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || null,
      source: r.source,
      createdAt: r.created_at,
      quoteId: r.quote_requests?.quote_id || null,
      customerName: [r.quote_requests?.first_name, r.quote_requests?.last_name].filter(Boolean).join(' ') || null,
      device: [r.quote_requests?.brand_name, r.quote_requests?.model_name].filter(Boolean).join(' ') || null,
      repairType: r.quote_requests?.repair_type_key || null,
    })),
    summary: {
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution,
    },
  })
}
