import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'
import { sendRepairStatusNotification } from '../../../../../../lib/notifications'

export const runtime = 'nodejs'

export async function POST(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()
  const params = await context.params
  const orderId = params?.orderId

  // Verify org ownership + fetch quote for submission_source and email
  const { data: order, error: orderErr } = await supabase
    .from('repair_orders')
    .select('id, quote_request_id, organization_id')
    .eq('id', orderId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const { data: quote, error: quoteErr } = await supabase
    .from('quote_requests')
    .select('id, submission_source, guest_email, customer_id')
    .eq('id', order.quote_request_id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (quoteErr) return NextResponse.json({ error: quoteErr.message }, { status: 500 })
  if (!quote) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })

  if (quote.submission_source !== 'walk_in') {
    return NextResponse.json({ error: 'Intake confirmation is only available for walk-in orders.' }, { status: 400 })
  }

  // Resolve customer email
  let customerEmail = quote.guest_email || null
  if (!customerEmail && quote.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('email')
      .eq('id', quote.customer_id)
      .maybeSingle()
    customerEmail = customer?.email || null
  }

  if (!customerEmail) {
    return NextResponse.json({ error: 'No email address on file for this customer.' }, { status: 400 })
  }

  // Check if we already sent the walk-in intake notification.
  // historyId is null for manually-triggered intake confirms, so sendRepairStatusNotification
  // uses dedupe_key='repair-status:null'. Checking that key avoids blocking if the order
  // later has other status-change notifications (which use dedupe_key='repair-status:<uuid>').
  const { data: existingNotif } = await supabase
    .from('notifications')
    .select('id')
    .eq('repair_order_id', orderId)
    .eq('dedupe_key', 'repair-status:null')
    .maybeSingle()

  if (existingNotif) {
    return NextResponse.json({ error: 'Intake confirmation already sent for this order.' }, { status: 409 })
  }

  try {
    await sendRepairStatusNotification({
      supabase,
      quoteRequestId: order.quote_request_id,
      repairOrderId: orderId,
      historyId: null,
      status: 'received',
      note: null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send notification.' },
      { status: 500 }
    )
  }
}
