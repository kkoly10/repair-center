import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../../lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request, context) {
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
      return NextResponse.json({ ok: true, messages: [] })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('repair_messages')
      .select('id, sender_role, body, internal_only, created_at')
      .eq('repair_order_id', repairOrder.id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    return NextResponse.json({ ok: true, messages: messages || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load messages.' },
      { status: 500 }
    )
  }
}

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId
    const body = await request.json()

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID.' }, { status: 400 })
    }

    const messageBody = (body.body || '').toString().trim()
    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required.' }, { status: 400 })
    }

    const senderRole = ['admin', 'tech'].includes(body.senderRole) ? body.senderRole : 'admin'
    const internalOnly = Boolean(body.internalOnly)

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('quote_id', quoteId)
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

    const { data: message, error: insertError } = await supabase
      .from('repair_messages')
      .insert({
        repair_order_id: repairOrder.id,
        sender_role: senderRole,
        body: messageBody,
        internal_only: internalOnly,
      })
      .select('id, sender_role, body, internal_only, created_at')
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
