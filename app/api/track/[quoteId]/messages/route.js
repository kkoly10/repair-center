import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { resolveTrackingIdentifier } from '../../../../../lib/resolveTrackingIdentifier'

export const runtime = 'nodejs'

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const identifier = params?.quoteId
    const body = await request.json()
    const email = (body?.email || '').toString().trim().toLowerCase()
    const messageBody = (body?.body || '').toString().trim()
    const orgSlug = (body?.orgSlug || '').toString().trim()

    if (!identifier || !email || !messageBody) {
      return NextResponse.json(
        { error: 'Tracking identifier, email, and message are required.' },
        { status: 400 }
      )
    }

    let orgId = null
    if (orgSlug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .eq('status', 'active')
        .maybeSingle()
      if (org) orgId = org.id
    }

    const resolved = await resolveTrackingIdentifier(identifier, { supabase, orgId })
    const quoteRequest = resolved.quoteRequest
    const repairOrder = resolved.repairOrder

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Repair request not found.' }, { status: 404 })
    }

    const [customerResult, ensuredOrderResult] = await Promise.all([
      quoteRequest.customer_id
        ? supabase
            .from('customers')
            .select('id, email')
            .eq('id', quoteRequest.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      repairOrder
        ? Promise.resolve({ data: repairOrder, error: null })
        : supabase
            .from('repair_orders')
            .select('*')
            .eq('quote_request_id', quoteRequest.id)
            .maybeSingle(),
    ])

    if (customerResult.error) throw customerResult.error
    if (ensuredOrderResult.error) throw ensuredOrderResult.error

    const allowedEmails = [quoteRequest.guest_email, customerResult.data?.email]
      .filter(Boolean)
      .map((value) => value.toLowerCase())

    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { error: 'Email does not match this repair request.' },
        { status: 403 }
      )
    }

    if (!ensuredOrderResult.data?.id) {
      return NextResponse.json(
        { error: 'A repair order must exist before sending messages.' },
        { status: 400 }
      )
    }

    const { data: message, error: insertError } = await supabase
      .from('repair_messages')
      .insert({
        organization_id: quoteRequest.organization_id,
        repair_order_id: ensuredOrderResult.data.id,
        sender_customer_id: customerResult.data?.id || null,
        sender_role: 'customer',
        body: messageBody,
        internal_only: false,
        customer_read_at: new Date().toISOString(),
        staff_read_at: null,
      })
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
