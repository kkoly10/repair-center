import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function POST(request, context) {
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

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
    }

    const { data: repairOrder, error: orderError } = await supabase
      .from('repair_orders')
      .select('id, inspection_deposit_required, inspection_deposit_paid_at')
      .eq('quote_request_id', quoteRequest.id)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!repairOrder) {
      return NextResponse.json({ error: 'Repair order not found.' }, { status: 404 })
    }

    if (repairOrder.inspection_deposit_paid_at) {
      return NextResponse.json({ error: 'Deposit already marked as paid.' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: orgId,
        repair_order_id: repairOrder.id,
        payment_kind: 'inspection_deposit',
        provider: 'manual',
        status: 'paid',
        amount: repairOrder.inspection_deposit_required,
        paid_at: now,
      })

    if (paymentError) throw paymentError

    const { error: updateError } = await supabase
      .from('repair_orders')
      .update({ inspection_deposit_paid_at: now })
      .eq('id', repairOrder.id)
      .eq('organization_id', orgId)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to mark deposit paid.' },
      { status: 500 }
    )
  }
}
