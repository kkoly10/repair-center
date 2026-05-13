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
      .select('*')
      .eq('quote_id', quoteId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (quoteError) throw quoteError
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
    }

    const [
      customerResult,
      orderResult,
      orgResult,
    ] = await Promise.all([
      quoteRequest.customer_id
        ? supabase
            .from('customers')
            .select('id, first_name, last_name, email, phone')
            .eq('id', quoteRequest.customer_id)
            .eq('organization_id', orgId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('repair_orders')
        .select('id, order_number, current_status, intake_received_at, shipped_at, delivered_at, created_at')
        .eq('quote_request_id', quoteRequest.id)
        .eq('organization_id', orgId)
        .maybeSingle(),
      supabase
        .from('organizations')
        .select('name, slug')
        .eq('id', orgId)
        .maybeSingle(),
    ])

    if (customerResult.error) throw customerResult.error
    if (orderResult.error) throw orderResult.error
    if (orgResult.error) throw orgResult.error

    let estimateItems = []
    let estimate = null
    let payments = []

    if (orderResult.data?.id) {
      const [estimateResult, paymentsResult] = await Promise.all([
        supabase
          .from('quote_estimates')
          .select('id, total_amount, created_at')
          .eq('quote_request_id', quoteRequest.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('payments')
          .select('id, payment_kind, amount, status, provider, created_at')
          .eq('repair_order_id', orderResult.data.id)
          .order('created_at', { ascending: true }),
      ])

      if (estimateResult.error) throw estimateResult.error
      if (paymentsResult.error) throw paymentsResult.error

      estimate = estimateResult.data
      payments = paymentsResult.data || []

      if (estimate?.id) {
        const { data: items, error: itemsError } = await supabase
          .from('quote_estimate_items')
          .select('id, description, quantity, unit_amount, line_total')
          .eq('estimate_id', estimate.id)
          .order('created_at', { ascending: true })

        if (itemsError) throw itemsError
        estimateItems = items || []
      }
    }

    const customer = customerResult.data
    const order = orderResult.data

    return NextResponse.json({
      ok: true,
      invoice: {
        org: {
          name: orgResult.data?.name || 'Repair Center',
          slug: orgResult.data?.slug || '',
        },
        quote: {
          quote_id: quoteRequest.quote_id,
          brand_name: quoteRequest.brand_name,
          model_name: quoteRequest.model_name,
          repair_type_key: quoteRequest.repair_type_key,
          issue_description: quoteRequest.issue_description,
        },
        customer: {
          name: [
            customer?.first_name || quoteRequest.first_name,
            customer?.last_name || quoteRequest.last_name,
          ].filter(Boolean).join(' ') || 'Guest',
          email: customer?.email || quoteRequest.guest_email || '',
          phone: customer?.phone || quoteRequest.guest_phone || '',
        },
        order: order
          ? {
              id: order.id,
              order_number: order.order_number,
              current_status: order.current_status,
              created_at: order.created_at,
              intake_received_at: order.intake_received_at,
              shipped_at: order.shipped_at,
              delivered_at: order.delivered_at,
            }
          : null,
        estimate: estimate
          ? {
              total_amount: estimate.total_amount,
            }
          : null,
        line_items: estimateItems.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_amount,
          total_price: i.line_total,
        })),
        payments: payments
          .filter((p) => p.status === 'paid')
          .map((p) => ({
            kind: p.payment_kind,
            amount: p.amount,
            provider: p.provider,
            created_at: p.created_at,
          })),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load invoice.' },
      { status: 500 }
    )
  }
}
