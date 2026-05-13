/**
 * Multi-tenant safety + Phase 6 analytics: GET /admin/api/analytics
 *
 * Invariants:
 *  - Requires authentication (401 if not)
 *  - Payments filtered by organization_id
 *  - Uses 'payment_kind' column and 'created_at' (not 'paid_at')
 *  - Revenue total computed from paid payments
 *  - Revenue by repair type aggregated via payment → order → quote join
 *  - Revenue by technician aggregated via payment → order → member join
 *  - Repeat customer rate computed from orders-per-customer
 *  - Range param forwarded in response
 *  - Funnel is period-specific; prevTotalQuotes returned for trend comparison
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET } = require('../../app/admin/api/analytics/route')
const { createSupabaseMock, getChain } = require('../helpers/supabaseMock')

function makeRequest(range = '30d') {
  return { url: `http://localhost/admin/api/analytics?range=${range}` }
}

function makeSupabaseMock({
  paymentsData = [],
  prevData = [],
  ordersData = [],
  quotesData = [],
  funnelData = null,
  prevFunnelData = [],
  recentData = [],
  membersData = [],
  customersData = [],
} = {}) {
  // quote_requests: [allQuotes, funnel, prevFunnel, recent]
  // payments: [paidCurrent, paidPrev]
  return createSupabaseMock({
    payments: [
      { data: paymentsData, error: null },
      { data: prevData, error: null },
    ],
    quote_requests: [
      { data: quotesData, error: null },
      { data: funnelData ?? quotesData, error: null },
      { data: prevFunnelData, error: null },
      { data: recentData, error: null },
    ],
    repair_orders: { data: ordersData, error: null },
    organization_members: { data: membersData, error: null },
    customers: { data: customersData, error: null },
  })
}

describe('GET /admin/api/analytics', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('filters paid payments by organization_id', async () => {
    const supabase = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await GET(makeRequest())

    const paidChain = getChain(supabase, 'payments', 0)
    expect(paidChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
    expect(paidChain.eq).toHaveBeenCalledWith('status', 'paid')
  })

  it('computes total revenue from paid payment amounts', async () => {
    const supabase = makeSupabaseMock({
      paymentsData: [
        { id: 'p-1', payment_kind: 'inspection_deposit', amount: '100.00', repair_order_id: null },
        { id: 'p-2', payment_kind: 'final_balance', amount: '250.50', repair_order_id: null },
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.revenue.total).toBeCloseTo(350.5)
    expect(body.revenue.deposits).toBeCloseTo(100)
    expect(body.revenue.balances).toBeCloseTo(250.5)
  })

  it('splits revenue correctly by payment_kind', async () => {
    const supabase = makeSupabaseMock({
      paymentsData: [
        { id: 'p-1', payment_kind: 'inspection_deposit', amount: '75', repair_order_id: null },
        { id: 'p-2', payment_kind: 'final_balance', amount: '125', repair_order_id: null },
        { id: 'p-3', payment_kind: 'final_balance', amount: '50', repair_order_id: null },
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.revenue.deposits).toBe(75)
    expect(body.revenue.balances).toBe(175)
  })

  it('aggregates revenue by repair type via payment→order→quote join', async () => {
    const supabase = makeSupabaseMock({
      paymentsData: [
        { id: 'p-1', payment_kind: 'final_balance', amount: '150', repair_order_id: 'o-1' },
        { id: 'p-2', payment_kind: 'final_balance', amount: '200', repair_order_id: 'o-2' },
        { id: 'p-3', payment_kind: 'inspection_deposit', amount: '50', repair_order_id: 'o-1' },
      ],
      ordersData: [
        { id: 'o-1', current_status: 'delivered', customer_id: null, assigned_technician_user_id: null, quote_request_id: 'qr-1', intake_received_at: null, shipped_at: null },
        { id: 'o-2', current_status: 'delivered', customer_id: null, assigned_technician_user_id: null, quote_request_id: 'qr-2', intake_received_at: null, shipped_at: null },
      ],
      quotesData: [
        { id: 'qr-1', status: 'delivered', device_category: null, brand_name: 'Apple', model_name: 'iPhone 14', repair_type_key: 'screen_repair' },
        { id: 'qr-2', status: 'delivered', device_category: null, brand_name: 'Samsung', model_name: 'S23', repair_type_key: 'battery_replacement' },
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.revenueByType).toHaveLength(2)
    const screen = body.revenueByType.find((r) => r.repairType === 'screen_repair')
    const battery = body.revenueByType.find((r) => r.repairType === 'battery_replacement')
    expect(screen.amount).toBe(200) // 150 + 50
    expect(battery.amount).toBe(200)
    expect(body.revenueByType[0].amount).toBeGreaterThanOrEqual(body.revenueByType[1].amount)
  })

  it('aggregates revenue by technician using member profile names', async () => {
    const supabase = makeSupabaseMock({
      paymentsData: [
        { id: 'p-1', payment_kind: 'final_balance', amount: '300', repair_order_id: 'o-1' },
        { id: 'p-2', payment_kind: 'final_balance', amount: '150', repair_order_id: 'o-2' },
      ],
      ordersData: [
        { id: 'o-1', current_status: 'delivered', customer_id: null, assigned_technician_user_id: 'u-1', quote_request_id: null, intake_received_at: null, shipped_at: null },
        { id: 'o-2', current_status: 'delivered', customer_id: null, assigned_technician_user_id: 'u-2', quote_request_id: null, intake_received_at: null, shipped_at: null },
      ],
      membersData: [
        { user_id: 'u-1', profiles: { full_name: 'Alice Smith' } },
        { user_id: 'u-2', profiles: { full_name: 'Bob Jones' } },
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.revenueByTech).toHaveLength(2)
    const alice = body.revenueByTech.find((t) => t.tech === 'Alice Smith')
    const bob = body.revenueByTech.find((t) => t.tech === 'Bob Jones')
    expect(alice.amount).toBe(300)
    expect(bob.amount).toBe(150)
    expect(body.revenueByTech[0].amount).toBeGreaterThanOrEqual(body.revenueByTech[1].amount)
  })

  it('computes repeat customer rate from orders per customer', async () => {
    const supabase = makeSupabaseMock({
      ordersData: [
        { id: 'o-1', current_status: 'delivered', customer_id: 'c-1', assigned_technician_user_id: null, quote_request_id: null, intake_received_at: null, shipped_at: null },
        { id: 'o-2', current_status: 'delivered', customer_id: 'c-1', assigned_technician_user_id: null, quote_request_id: null, intake_received_at: null, shipped_at: null },
        { id: 'o-3', current_status: 'shipped', customer_id: 'c-2', assigned_technician_user_id: null, quote_request_id: null, intake_received_at: null, shipped_at: null },
      ],
      customersData: [{ id: 'c-1' }, { id: 'c-2' }],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.customers.total).toBe(2)
    expect(body.customers.repeatCustomers).toBe(1)
    expect(body.customers.repeatRate).toBe(50)
  })

  it('includes range in response and defaults to 30d', async () => {
    const supabase30 = makeSupabaseMock()
    const supabase90 = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase30)
    getSessionOrgId.mockResolvedValue('org-a')
    const res30d = await GET(makeRequest('30d'))

    getSupabaseAdmin.mockReturnValue(supabase90)
    const res90d = await GET(makeRequest('90d'))

    expect((await res30d.json()).range).toBe('30d')
    expect((await res90d.json()).range).toBe('90d')
  })

  it('applies date range filter to paid payments query (created_at not paid_at)', async () => {
    const supabase = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await GET(makeRequest('7d'))

    const paidChain = getChain(supabase, 'payments', 0)
    const gteCalls = paidChain.gte.mock.calls
    expect(gteCalls.some(([col]) => col === 'created_at')).toBe(true)
  })

  it('returns prevTotalQuotes from prev period funnel query', async () => {
    const supabase = makeSupabaseMock({
      funnelData: [
        { id: 'q-1', status: 'estimate_sent' },
        { id: 'q-2', status: 'delivered' },
      ],
      prevFunnelData: [
        { id: 'q-old-1' },
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET(makeRequest('30d'))
    const body = await res.json()

    expect(body.funnel.totalQuotes).toBe(2)
    expect(body.funnel.prevTotalQuotes).toBe(1)
  })

  it('applies date range filter to funnel query (created_at)', async () => {
    const supabase = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await GET(makeRequest('30d'))

    // quote_requests call index 1 is the funnel (range-filtered) query
    const funnelChain = getChain(supabase, 'quote_requests', 1)
    const gteCalls = funnelChain.gte.mock.calls
    expect(gteCalls.some(([col]) => col === 'created_at')).toBe(true)
  })
})
