/**
 * Refund flow tests
 *
 * Invariants:
 *  - 401 when not authenticated
 *  - 404 when paymentId is in a different org
 *  - 400 when payment.status is not 'paid'
 *  - 400 when amountCents exceeds the original payment amount
 *  - Happy path: calls Stripe with right args, inserts negative-amount refund row
 *  - Connect path: passes reverse_transfer: true when org has a Connect account
 *  - 502 + reportError when Stripe rejects the refund
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/observability')
jest.mock('stripe')

const { getSessionContext } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { reportError } = require('../../lib/observability')
const Stripe = require('stripe')
const { createSupabaseMock, getChain } = require('../helpers/supabaseMock')

const { POST: refundPOST } = require('../../app/admin/api/quotes/[quoteId]/refund/route')

const ORG = 'org-abc'
const QUOTE_ID = 'RCQ-12345'
const QUOTE_REQUEST_ID = 'qr-uuid'
const REPAIR_ORDER_ID = 'order-uuid'
const PAYMENT_ID = 'payment-uuid'
const PAYMENT_INTENT_ID = 'pi_test_123'
const REFUND_ID = 're_test_456'
const USER_ID = 'user-uuid'

function makeRequest(body) {
  return {
    json: jest.fn().mockResolvedValue(body || {}),
  }
}

function makeContext(quoteId = QUOTE_ID) {
  return { params: Promise.resolve({ quoteId }) }
}

function paidStripePayment(overrides = {}) {
  return {
    id: PAYMENT_ID,
    organization_id: ORG,
    repair_order_id: REPAIR_ORDER_ID,
    payment_kind: 'inspection_deposit',
    provider: 'stripe',
    provider_payment_intent_id: PAYMENT_INTENT_ID,
    amount: '50.00',
    status: 'paid',
    ...overrides,
  }
}

// `piAmountRefunded` (default 0) lets a test simulate a partially-refunded
// PaymentIntent so we can verify the remaining-cap check against Stripe state.
function mockStripeOk({ piAmount = 5000, piAmountRefunded = 0 } = {}) {
  process.env.STRIPE_SECRET_KEY = 'sk_test'
  const refundsCreate = jest.fn().mockResolvedValue({ id: REFUND_ID })
  const paymentIntentsRetrieve = jest.fn().mockResolvedValue({
    id: PAYMENT_INTENT_ID,
    amount: piAmount,
    amount_refunded: piAmountRefunded,
  })
  Stripe.mockImplementation(() => ({
    refunds: { create: refundsCreate },
    paymentIntents: { retrieve: paymentIntentsRetrieve },
  }))
  return { refundsCreate, paymentIntentsRetrieve }
}

function buildSupabase({ payment = paidStripePayment(), connectAccountId = null } = {}) {
  return createSupabaseMock({
    quote_requests: { data: { id: QUOTE_REQUEST_ID }, error: null },
    repair_orders: { data: { id: REPAIR_ORDER_ID }, error: null },
    payments: { data: payment, error: null },
    organization_payment_settings: {
      data: connectAccountId ? { stripe_connect_account_id: connectAccountId } : {},
      error: null,
    },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  getSessionContext.mockResolvedValue({ orgId: ORG, userId: USER_ID })
})

describe('POST /admin/api/quotes/[quoteId]/refund', () => {
  test('401 when not authenticated', async () => {
    getSessionContext.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await refundPOST(makeRequest({ paymentId: PAYMENT_ID }), makeContext())
    expect(res.status).toBe(401)
  })

  test('404 when paymentId belongs to a different org (not found under org filter)', async () => {
    const supabase = createSupabaseMock({
      quote_requests: { data: { id: QUOTE_REQUEST_ID }, error: null },
      repair_orders: { data: { id: REPAIR_ORDER_ID }, error: null },
      payments: { data: null, error: null }, // org filter excludes it
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    mockStripeOk()

    const res = await refundPOST(makeRequest({ paymentId: 'other-org-payment' }), makeContext())
    expect(res.status).toBe(404)

    // Verify the payments query enforced the org filter
    const paymentsChain = getChain(supabase, 'payments', 0)
    expect(paymentsChain.eq).toHaveBeenCalledWith('organization_id', ORG)
  })

  test('400 when payment.status is not paid', async () => {
    const supabase = buildSupabase({ payment: paidStripePayment({ status: 'pending' }) })
    getSupabaseAdmin.mockReturnValue(supabase)
    mockStripeOk()

    const res = await refundPOST(makeRequest({ paymentId: PAYMENT_ID }), makeContext())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/paid/i)
  })

  test('400 when amountCents exceeds payment.amount', async () => {
    // amount = $50.00 → 5000 cents. Request 6000 cents.
    const supabase = buildSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)
    mockStripeOk()

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 6000 }),
      makeContext()
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/exceed/i)
  })

  test('happy path: calls Stripe with right args, inserts negative-amount refund row, returns refund id', async () => {
    const supabase = buildSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)
    const { refundsCreate } = mockStripeOk()

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 5000, reason: 'Customer changed mind' }),
      makeContext()
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.refundId).toBe(REFUND_ID)
    expect(body.amountCents).toBe(5000)

    // Stripe called with right args (no reverse_transfer for non-Connect)
    // Second arg is the idempotency key option.
    expect(refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: PAYMENT_INTENT_ID,
        amount: 5000,
        reason: 'requested_by_customer',
      }),
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^refund_/) })
    )
    expect(refundsCreate.mock.calls[0][0].reverse_transfer).toBeUndefined()

    // Verify insert into payments table
    // The payments table is called twice: once to read, then once to insert.
    // Find the chain with insert called.
    const insertCall = supabase.from.mock.calls.find(([t], i) => {
      if (t !== 'payments') return false
      const result = supabase.from.mock.results[i].value
      return result.insert.mock.calls.length > 0
    })
    expect(insertCall).toBeTruthy()

    const allPaymentsChains = supabase.from.mock.calls
      .map(([t], i) => (t === 'payments' ? supabase.from.mock.results[i].value : null))
      .filter(Boolean)
    const insertedChain = allPaymentsChains.find((c) => c.insert.mock.calls.length > 0)
    const insertArg = insertedChain.insert.mock.calls[0][0]
    expect(insertArg.payment_kind).toBe('refund')
    expect(insertArg.provider).toBe('stripe')
    expect(insertArg.provider_payment_intent_id).toBe(REFUND_ID)
    expect(insertArg.amount).toBe(-50) // -$50.00 dollars
    expect(insertArg.status).toBe('paid')
    expect(insertArg.organization_id).toBe(ORG)
    expect(insertArg.repair_order_id).toBe(REPAIR_ORDER_ID)
    expect(insertArg.note).toMatch(/Customer changed mind/)
    expect(insertArg.note).toMatch(new RegExp(USER_ID))
  })

  test('Stripe Connect: passes reverse_transfer: true when org has stripe_connect_account_id', async () => {
    const supabase = buildSupabase({ connectAccountId: 'acct_test_789' })
    getSupabaseAdmin.mockReturnValue(supabase)
    const { refundsCreate } = mockStripeOk()

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 5000 }),
      makeContext()
    )
    expect(res.status).toBe(200)

    expect(refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: PAYMENT_INTENT_ID,
        amount: 5000,
        reverse_transfer: true,
      }),
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^refund_/) })
    )
  })

  test('502 + reportError when Stripe rejects the refund', async () => {
    const supabase = buildSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)

    process.env.STRIPE_SECRET_KEY = 'sk_test'
    const stripeError = new Error('charge_already_refunded')
    Stripe.mockImplementation(() => ({
      refunds: { create: jest.fn().mockRejectedValue(stripeError) },
      paymentIntents: {
        retrieve: jest.fn().mockResolvedValue({ id: PAYMENT_INTENT_ID, amount: 5000, amount_refunded: 0 }),
      },
    }))

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 5000 }),
      makeContext()
    )
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toMatch(/payment provider/i)

    expect(reportError).toHaveBeenCalledWith(
      stripeError,
      expect.objectContaining({
        area: 'admin-refund',
        quoteRequestId: QUOTE_REQUEST_ID,
        paymentId: PAYMENT_ID,
      })
    )
  })

  test('400 when amount exceeds remaining (Stripe shows prior refunds on the PaymentIntent)', async () => {
    // Original payment was $50.00 (5000c); $30.00 (3000c) already refunded
    // elsewhere. A request for $30.00 more must be rejected — only $20.00
    // remains refundable.
    const supabase = buildSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)
    mockStripeOk({ piAmount: 5000, piAmountRefunded: 3000 })

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 3000 }),
      makeContext()
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/exceeds.*remaining/i)
    expect(body.remainingCents).toBe(2000)
    expect(body.alreadyRefundedCents).toBe(3000)
  })

  test('200 when amount equals remaining after prior partial refund', async () => {
    // $50 charged, $30 already refunded → $20 remaining. Request $20 → ok.
    const supabase = buildSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)
    const { refundsCreate } = mockStripeOk({ piAmount: 5000, piAmountRefunded: 3000 })

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 2000 }),
      makeContext()
    )
    expect(res.status).toBe(200)
    expect(refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 2000 }),
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^refund_/) })
    )
  })

  test('reports alreadyRefundedCents directly from Stripe pi.amount_refunded', async () => {
    const supabase = buildSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)
    // pi.amount=5000, amount_refunded=3000 ⇒ remaining=2000; request 3000 → reject
    mockStripeOk({ piAmount: 5000, piAmountRefunded: 3000 })

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 3000 }),
      makeContext()
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    // Stripe-authoritative count, not derived from DB
    expect(body.alreadyRefundedCents).toBe(3000)
  })

  test('503 when STRIPE_SECRET_KEY is not set — does not leak the env var name', async () => {
    const supabase = buildSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)
    delete process.env.STRIPE_SECRET_KEY

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 1000 }),
      makeContext()
    )
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('Payment provider is not configured.')
    expect(JSON.stringify(body)).not.toContain('STRIPE_SECRET_KEY')
  })

  test('500 catch path does not leak underlying error message', async () => {
    // Force the quote lookup to throw — exercise the outer catch path
    const supabase = createSupabaseMock({
      quote_requests: { data: null, error: { message: 'INTERNAL: connection pool exhausted at db-pool.js:42' } },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    mockStripeOk()

    const res = await refundPOST(
      makeRequest({ paymentId: PAYMENT_ID, amountCents: 1000 }),
      makeContext()
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Unable to issue refund.')
    expect(JSON.stringify(body)).not.toContain('db-pool.js')
  })
})
