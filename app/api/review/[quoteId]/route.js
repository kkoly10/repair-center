import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  const params = await context.params
  const quoteId = params?.quoteId

  if (!quoteId) {
    return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const rating = Number(body?.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5.' }, { status: 400 })
  }

  const comment = body?.comment ? String(body.comment).trim().slice(0, 2000) : null
  const source = ['email_link', 'web', 'manual'].includes(body?.source) ? body.source : 'web'

  const { data: quoteRequest, error: quoteError } = await supabase
    .from('quote_requests')
    .select('id, organization_id')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (quoteError) {
    return NextResponse.json({ error: quoteError.message }, { status: 500 })
  }
  if (!quoteRequest) {
    return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
  }

  const { data: repairOrder } = await supabase
    .from('repair_orders')
    .select('id')
    .eq('quote_request_id', quoteRequest.id)
    .maybeSingle()

  const { error: insertError } = await supabase
    .from('repair_reviews')
    .insert({
      organization_id: quoteRequest.organization_id,
      quote_request_id: quoteRequest.id,
      repair_order_id: repairOrder?.id ?? null,
      rating,
      comment,
      source,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'A review for this quote already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
