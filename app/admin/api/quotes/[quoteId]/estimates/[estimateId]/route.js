import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId
    const estimateId = params?.estimateId

    if (!quoteId || !estimateId) {
      return NextResponse.json({ error: 'Missing quote ID or estimate ID.' }, { status: 400 })
    }

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    const { data: estimate, error: estimateError } = await supabase
      .from('quote_estimates')
      .select('id, estimate_kind, status, subtotal_amount, shipping_amount, tax_amount, discount_amount, deposit_credit_amount, total_amount, warranty_days, turnaround_note, customer_visible_notes, internal_notes, sent_at, approved_at, declined_at, expires_at, created_at')
      .eq('id', estimateId)
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (estimateError) throw estimateError
    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found.' }, { status: 404 })
    }

    const { data: items, error: itemsError } = await supabase
      .from('quote_estimate_items')
      .select('id, line_type, description, quantity, unit_amount, line_total')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: true })

    if (itemsError) throw itemsError

    return NextResponse.json({ ok: true, estimate, items: items || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load estimate.' },
      { status: 500 }
    )
  }
}
