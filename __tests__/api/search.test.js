/**
 * GET /admin/api/search
 *
 * Invariants:
 *  - 401 if not authenticated
 *  - Returns empty array for query < 2 chars
 *  - Queries quotes, orders, customers in parallel using org-scoped ilike/or filters
 *  - Results include type, title, subtitle, href, createdAt
 *  - Results sorted by most recent createdAt
 *  - org isolation: only searches within session org
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET } = require('../../app/admin/api/search/route')

function makeRequest(q = '') {
  return { url: `http://localhost/admin/api/search?q=${encodeURIComponent(q)}` }
}

function makeSupabaseMock({ quotesData = [], ordersData = [], customersData = [] } = {}) {
  function makeChain(result) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: result, error: null }),
    }
  }

  const quotesChain = makeChain(quotesData)
  const ordersChain = makeChain(ordersData)
  const customersChain = makeChain(customersData)

  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'quote_requests') return quotesChain
      if (table === 'repair_orders') return ordersChain
      if (table === 'customers') return customersChain
      return makeChain([])
    }),
  }
  return { supabase }
}

describe('GET /admin/api/search', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET(makeRequest('iphone'))
    expect(res.status).toBe(401)
  })

  it('returns empty results for query shorter than 2 chars', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET(makeRequest('a'))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.results).toHaveLength(0)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns empty results for blank query', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET(makeRequest(''))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.results).toHaveLength(0)
  })

  it('queries all three tables with org filter', async () => {
    getSessionOrgId.mockResolvedValue('org-a')
    const { supabase } = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)

    await GET(makeRequest('iphone'))

    expect(supabase.from).toHaveBeenCalledWith('quote_requests')
    expect(supabase.from).toHaveBeenCalledWith('repair_orders')
    expect(supabase.from).toHaveBeenCalledWith('customers')
  })

  it('maps quote results to correct shape with href', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({
      quotesData: [{
        id: 'qr-1',
        quote_id: 'RCQ-001',
        first_name: 'Jane',
        last_name: 'Doe',
        guest_email: 'jane@example.com',
        brand_name: 'Apple',
        model_name: 'iPhone 14',
        repair_type_key: 'screen_repair',
        status: 'submitted',
        created_at: '2026-05-01T10:00:00Z',
      }],
    })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET(makeRequest('jane'))
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.results).toHaveLength(1)
    const r = body.results[0]
    expect(r.type).toBe('quote')
    expect(r.title).toBe('Jane Doe')
    expect(r.subtitle).toBe('Apple iPhone 14')
    expect(r.href).toBe('/admin/quotes/RCQ-001')
  })

  it('maps order results to correct shape with href', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({
      ordersData: [{
        id: 'o-1',
        order_number: 'RCO-101',
        current_status: 'in_repair',
        quote_request_id: 'qr-1',
        created_at: '2026-05-02T10:00:00Z',
      }],
    })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET(makeRequest('RCO-101'))
    const body = await res.json()

    const r = body.results[0]
    expect(r.type).toBe('order')
    expect(r.title).toBe('Order #RCO-101')
    expect(r.href).toBe('/admin/quotes/qr-1/order')
  })

  it('maps customer results to correct shape with href', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({
      customersData: [{
        id: 'c-1',
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bob@example.com',
        phone: null,
        created_at: '2026-05-03T10:00:00Z',
      }],
    })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET(makeRequest('bob'))
    const body = await res.json()

    const r = body.results[0]
    expect(r.type).toBe('customer')
    expect(r.title).toBe('Bob Smith')
    expect(r.subtitle).toBe('bob@example.com')
    expect(r.href).toBe('/admin/customers/c-1')
  })

  it('sorts mixed results by most recent createdAt', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({
      quotesData: [{
        id: 'q-1', quote_id: 'RCQ-1', first_name: 'A', last_name: '', guest_email: null,
        brand_name: null, model_name: null, repair_type_key: null, status: 'submitted',
        created_at: '2026-05-01T00:00:00Z',
      }],
      customersData: [{
        id: 'c-1', first_name: 'B', last_name: '', email: null, phone: null,
        created_at: '2026-05-05T00:00:00Z',
      }],
    })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET(makeRequest('test'))
    const body = await res.json()

    expect(body.results[0].createdAt).toBe('2026-05-05T00:00:00Z')
    expect(body.results[1].createdAt).toBe('2026-05-01T00:00:00Z')
  })
})
