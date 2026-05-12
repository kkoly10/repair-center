import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../../lib/admin/getSessionOrgId'

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
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    const { data: repairOrder, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (orderError) throw orderError
    if (!repairOrder) {
      return NextResponse.json({ ok: true, messages: [], unreadCustomerCount: 0 })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('repair_messages')
      .select('id, sender_role, body, internal_only, created_at, staff_read_at, customer_read_at')
      .eq('repair_order_id', repairOrder.id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    const unreadCustomerCount = (messages || []).filter(
      (message) =>
        message.sender_role === 'customer' &&
        message.internal_only === false &&
        message.staff_read_at == null
    ).length

    return NextResponse.json({
      ok: true,
      messages: messages || [],
      unreadCustomerCount,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load messages.' },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()

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
      return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
    }

    const { data: repairOrder, error: orderError } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('quote_request_id', quoteRequest.id)
      .maybeSingle()

    if (orderError) throw orderError
    if (!repairOrder) {
      return NextResponse.json(
        { error: 'A repair order must exist before sending messages.' },
        { status: 400 }
      )
    }

    if (body.action === 'mark_customer_read') {
      const now = new Date().toISOString()

      const { error: markReadError } = await supabase
        .from('repair_messages')
        .update({ staff_read_at: now })
        .eq('repair_order_id', repairOrder.id)
        .eq('sender_role', 'customer')
        .eq('internal_only', false)
        .is('staff_read_at', null)

      if (markReadError) throw markReadError

      return NextResponse.json({ ok: true, unreadCustomerCount: 0 })
    }

    const messageBody = (body.body || '').toString().trim()
    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required.' }, { status: 400 })
    }

    const senderRole = ['admin', 'tech'].includes(body.senderRole) ? body.senderRole : 'admin'
    const internalOnly = Boolean(body.internalOnly)
    const now = new Date().toISOString()

    const insertPayload = {
      organization_id: orgId,
      repair_order_id: repairOrder.id,
      sender_role: senderRole,
      body: messageBody,
      internal_only: internalOnly,
      staff_read_at: now,
      customer_read_at: internalOnly ? now : null,
    }

    const { data: message, error: insertError } = await supabase
      .from('repair_messages')
      .insert(insertPayload)
      .select('id, sender_role, body, internal_only, created_at, staff_read_at, customer_read_at')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ ok: true, message })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send message.' },
      { status: 500 }
    )
  }
}