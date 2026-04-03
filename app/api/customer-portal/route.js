import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { NextResponse } from 'next/server'
import {
  CUSTOMER_PORTAL_SESSION_COOKIE,
  isVerificationExpired,
  normalizePortalEmail,
  readPortalSessionValue,
} from '../../../lib/security/customerPortalVerification'

export const runtime = 'nodejs'

export async function POST(request) {
  const supabase = getSupabaseAdmin()

  try {
    const body = await request.json()
    const email = normalizePortalEmail(body?.email)

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email is required.' },
        { status: 400 }
      )
    }

    const sessionValue = request.cookies.get(CUSTOMER_PORTAL_SESSION_COOKIE)?.value
    const session = readPortalSessionValue(sessionValue)

    if (!session || session.email !== email || isVerificationExpired(session.expiresAt)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Your portal session has expired. Please verify your email again.',
        },
        { status: 401 }
      )
    }

    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .ilike('email', email)
      .limit(5)

    if (customerError) throw customerError

    const customer =
      (customers || []).find(
        (item) => normalizePortalEmail(item.email) === email
      ) || null

    const [guestQuotesResult, customerQuotesResult] = await Promise.all([
      supabase
        .from('quote_requests')
        .select('*')
        .ilike('guest_email', email)
        .order('created_at', { ascending: false }),
      customer?.id
        ? supabase
            .from('quote_requests')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ])

    if (guestQuotesResult.error) throw guestQuotesResult.error
    if (customerQuotesResult.error) throw customerQuotesResult.error

    const quoteMap = new Map()

    for (const quote of [...(guestQuotesResult.data || []), ...(customerQuotesResult.data || [])]) {
      if (!quoteMap.has(quote.id)) {
        quoteMap.set(quote.id, quote)
      }
    }

    const quotes = [...quoteMap.values()].sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )

    if (!quotes.length) {
      return NextResponse.json({
        ok: true,
        customer: {
          name:
            [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || '',
          email,
          phone: customer?.phone || '',
        },
        quotes: [],
        repairOrders: [],
        payments: [],
      })
    }

    const quoteIds = quotes.map((quote) => quote.id)

    const { data: repairOrders, error: repairOrdersError } = await supabase
      .from('repair_orders')
      .select('*')
      .in('quote_request_id', quoteIds)
      .order('created_at', { ascending: false })

    if (repairOrdersError) throw repairOrdersError

    const orderIds = (repairOrders || []).map((order) => order.id)

    let payments = []
    if (orderIds.length) {
      const { data: paymentRows, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('repair_order_id', orderIds)
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError
      payments = paymentRows || []
    }

    const fallbackQuote = quotes[0]
    const customerName =
      [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
      [fallbackQuote?.first_name, fallbackQuote?.last_name].filter(Boolean).join(' ')

    return NextResponse.json({
      ok: true,
      customer: {
        name: customerName || 'Customer',
        email: customer?.email || fallbackQuote?.guest_email || email,
        phone: customer?.phone || fallbackQuote?.guest_phone || '',
      },
      quotes,
      repairOrders: repairOrders || [],
      payments,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected server error.',
      },
      { status: 500 }
    )
  }
}
