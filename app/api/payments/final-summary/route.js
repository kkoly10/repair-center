import { NextResponse } from 'next/server'
import { getPaymentSummaryByQuoteId } from '../../../../../lib/payments/getPaymentSummary'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const body = await request.json()
    const quoteId = (body?.quoteId || '').toString().trim()
    const email = (body?.email || '').toString().trim().toLowerCase()

    if (!quoteId || !email) {
      return NextResponse.json({ error: 'Quote ID and email are required.' }, { status: 400 })
    }

    const record = await getPaymentSummaryByQuoteId(quoteId)

    const allowedEmails = [record.quoteRequest.guest_email, record.customer?.email]
      .filter(Boolean)
      .map((value) => value.toLowerCase())

    if (!allowedEmails.includes(email)) {
      return NextResponse.json({ error: 'Email does not match this quote.' }, { status: 403 })
    }

    if (!record.repairOrder) {
      return NextResponse.json({ error: 'Repair order not found.' }, { status: 404 })
    }

    if (record.summary.finalBalanceDue <= 0) {
      return NextResponse.json({ error: 'No balance is due for this repair.' }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      quoteId,
      orderNumber: record.repairOrder.order_number,
      customerName:
        [record.customer?.first_name || record.quoteRequest.first_name, record.customer?.last_name || record.quoteRequest.last_name]
          .filter(Boolean)
          .join(' ') || 'Customer',
      summary: {
        estimateTotal: record.summary.estimateTotal,
        depositRequired: record.summary.depositRequired,
        depositPaidAmount: record.summary.depositPaidAmount,
        finalBalancePaidAmount: record.summary.finalBalancePaidAmount,
        totalCollected: record.summary.totalCollected,
        finalBalanceDue: record.summary.finalBalanceDue,
        depositPaid: record.summary.depositPaid,
        finalBalancePaid: record.summary.finalBalancePaid,
      },
      device: [record.quoteRequest.brand_name, record.quoteRequest.model_name].filter(Boolean).join(' '),
      repair: record.quoteRequest.repair_type_key || '',
      trackingPath: `/track/${quoteId}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load final balance summary.' },
      { status: 500 }
    )
  }
}
