import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { MAIL_IN_CONFIG } from '../../../../lib/mailInConfig'

export const runtime = 'nodejs'

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const quoteId = params?.quoteId
    const body = await request.json()
    const email = (body?.email || '').toString().trim().toLowerCase()

    if (!quoteId || !email) {
      return NextResponse.json(
        { error: 'Quote ID and email are required.' },
        { status: 400 }
      )
    }

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('quote_id', quoteId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json(
        { error: 'Quote request not found.' },
        { status: 404 }
      )
    }

    const [customerResult, orderResult, estimateResult] = await Promise.all([
      quoteRequest.customer_id
        ? supabase
            .from('customers')
            .select('id, first_name, last_name, email, phone')
            .eq('id', quoteRequest.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('repair_orders')
        .select('id, order_number, current_status, inspection_deposit_required')
        .eq('quote_request_id', quoteRequest.id)
        .maybeSingle(),
      supabase
        .from('quote_estimates')
        .select('id, total_amount, turnaround_note, warranty_days, status')
        .eq('quote_request_id', quoteRequest.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (customerResult.error) throw customerResult.error
    if (orderResult.error) throw orderResult.error
    if (estimateResult.error) throw estimateResult.error

    const allowedEmails = [quoteRequest.guest_email, customerResult.data?.email]
      .filter(Boolean)
      .map((value) => value.toLowerCase())

    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { error: 'Email does not match this mail-in request.' },
        { status: 403 }
      )
    }

    if (
      quoteRequest.status !== 'approved_for_mail_in' &&
      !orderResult.data?.order_number
    ) {
      return NextResponse.json(
        { error: 'Mail-in instructions are not available until the estimate is approved.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      ok: true,
      quote: {
        quote_id: quoteRequest.quote_id,
        brand_name: quoteRequest.brand_name,
        model_name: quoteRequest.model_name,
        repair_type_key: quoteRequest.repair_type_key,
        issue_description: quoteRequest.issue_description,
      },
      customer: {
        name: [
          customerResult.data?.first_name || quoteRequest.first_name,
          customerResult.data?.last_name || quoteRequest.last_name,
        ]
          .filter(Boolean)
          .join(' '),
        email: customerResult.data?.email || quoteRequest.guest_email,
        phone: customerResult.data?.phone || quoteRequest.guest_phone,
      },
      order: {
        order_number: orderResult.data?.order_number || null,
        current_status: orderResult.data?.current_status || 'awaiting_mail_in',
        inspection_deposit_required:
          orderResult.data?.inspection_deposit_required || 0,
      },
      estimate: {
        total_amount: estimateResult.data?.total_amount || 0,
        turnaround_note: estimateResult.data?.turnaround_note || null,
        warranty_days: estimateResult.data?.warranty_days || null,
        status: estimateResult.data?.status || null,
      },
      instructions: MAIL_IN_CONFIG,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load mail-in instructions.',
      },
      { status: 500 }
    )
  }
}
