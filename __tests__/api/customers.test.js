/**
 * Multi-tenant safety: GET /admin/api/customers + GET /admin/api/customers/[customerId]
 *
 * Invariants:
 *  - Requires authentication (401 if not)
 *  - Only returns customers from the session org
 *  - Repeat customer flag computed correctly from order count
 *  - Customer profile 404s for wrong org
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET: listGET } = require('../../app/admin/api/customers/route')
const { GET: profileGET } = require('../../app/admin/api/customers/[customerId]/route')

function makeListMock({ customersResult, ordersResult }) {
  function makeChain(result) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue(result),
    }
  }
  const customerChain = makeChain(customersResult)
  const orderChain = makeChain(ordersResult)
  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'customers') return customerChain
      if (table === 'repair_orders') return orderChain
      return makeChain({ data: [], error: null })
    }),
  }
  return { supabase, customerChain, orderChain }
}

function makeProfileMock({ customerResult, ordersResult, quotesResult, paymentsResult }) {
  function makeChain(result) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue(result),
    }
  }
  function makeListChain(result) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue(result),
    }
  }
  const customerChain = makeChain(customerResult)
  const orderChain = makeListChain(ordersResult)
  const quoteChain = makeListChain(quotesResult)
  const paymentChain = makeListChain(paymentsResult)

  let callCount = { customers: 0, repair_orders: 0, quote_requests: 0, payments: 0 }
  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      callCount[table] = (callCount[table] || 0) + 1
      if (table === 'customers') return customerChain
      if (table === 'repair_orders') return orderChain
      if (table === 'quote_requests') return quoteChain
      if (table === 'payments') return paymentChain
      return makeListChain({ data: [], error: null })
    }),
  }
  return { supabase }
}

describe('GET /admin/api/customers', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await listGET()
    expect(res.status).toBe(401)
  })

  it('filters customers by organization_id', async () => {
    const { supabase, customerChain } = makeListMock({
      customersResult: { data: [], error: null },
      ordersResult: { data: [], error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await listGET()

    expect(customerChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
  })

  it('filters orders by organization_id', async () => {
    const { supabase, orderChain } = makeListMock({
      customersResult: { data: [], error: null },
      ordersResult: { data: [], error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await listGET()

    expect(orderChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
  })

  it('returns ok:true with customers array on success', async () => {
    const { supabase } = makeListMock({
      customersResult: {
        data: [{ id: 'c-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', phone: null, created_at: '2026-01-01T00:00:00Z' }],
        error: null,
      },
      ordersResult: { data: [], error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await listGET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.customers).toHaveLength(1)
    expect(body.customers[0].name).toBe('Jane Doe')
    expect(body.customers[0].order_count).toBe(0)
    expect(body.customers[0].is_repeat).toBe(false)
  })

  it('marks repeat customers correctly', async () => {
    const { supabase } = makeListMock({
      customersResult: {
        data: [
          { id: 'c-1', first_name: 'Alice', last_name: null, email: 'a@example.com', phone: null, created_at: '2026-01-01T00:00:00Z' },
          { id: 'c-2', first_name: 'Bob', last_name: null, email: 'b@example.com', phone: null, created_at: '2026-01-01T00:00:00Z' },
        ],
        error: null,
      },
      ordersResult: {
        data: [
          { id: 'o-1', customer_id: 'c-1', current_status: 'delivered', created_at: '2026-02-01T00:00:00Z' },
          { id: 'o-2', customer_id: 'c-1', current_status: 'shipped', created_at: '2026-03-01T00:00:00Z' },
          { id: 'o-3', customer_id: 'c-2', current_status: 'repairing', created_at: '2026-04-01T00:00:00Z' },
        ],
        error: null,
      },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await listGET()
    const body = await res.json()

    const alice = body.customers.find((c) => c.email === 'a@example.com')
    const bob = body.customers.find((c) => c.email === 'b@example.com')

    expect(alice.order_count).toBe(2)
    expect(alice.is_repeat).toBe(true)
    expect(bob.order_count).toBe(1)
    expect(bob.is_repeat).toBe(false)
  })
})

describe('GET /admin/api/customers/[customerId]', () => {
  afterEach(() => jest.clearAllMocks())

  const mockContext = (customerId) => ({ params: Promise.resolve({ customerId }) })

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await profileGET(null, mockContext('c-1'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when customer is not in session org', async () => {
    const { supabase } = makeProfileMock({
      customerResult: { data: null, error: null },
      ordersResult: { data: [], error: null },
      quotesResult: { data: [], error: null },
      paymentsResult: { data: [], error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await profileGET(null, mockContext('c-other'))
    expect(res.status).toBe(404)
  })

  it('returns customer profile with orders and total_paid', async () => {
    const { supabase } = makeProfileMock({
      customerResult: {
        data: { id: 'c-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com', phone: '555-0100', created_at: '2026-01-01T00:00:00Z' },
        error: null,
      },
      ordersResult: {
        data: [
          { id: 'o-1', order_number: 'RCO-001', current_status: 'delivered', created_at: '2026-02-01T00:00:00Z', intake_received_at: null, shipped_at: null, delivered_at: null, quote_request_id: 'qr-1' },
        ],
        error: null,
      },
      quotesResult: {
        data: [
          { id: 'qr-1', quote_id: 'RCQ-AAA', brand_name: 'Apple', model_name: 'iPhone 14', repair_type_key: 'screen_repair', status: 'delivered', created_at: '2026-02-01T00:00:00Z' },
        ],
        error: null,
      },
      paymentsResult: {
        data: [
          { repair_order_id: 'o-1', amount: 150, status: 'paid' },
          { repair_order_id: 'o-1', amount: 50, status: 'paid' },
        ],
        error: null,
      },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await profileGET(null, mockContext('c-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.customer.name).toBe('Alice Smith')
    expect(body.customer.order_count).toBe(1)
    expect(body.customer.total_paid).toBe(200)
    expect(body.customer.is_repeat).toBe(false)
    expect(body.orders[0].brand_name).toBe('Apple')
  })
})
