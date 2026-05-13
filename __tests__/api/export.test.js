/**
 * GET /admin/api/export/customers
 * GET /admin/api/export/orders
 * GET /admin/api/export/reviews
 *
 * Invariants:
 *  - 401 if not authenticated
 *  - Returns text/csv with Content-Disposition attachment header
 *  - All queries scoped to session org
 *  - CSV includes correct headers row
 *  - Each data row maps correctly
 *  - Empty dataset still returns header row
 */

jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/admin/getSessionOrgId')

const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')

// ──── Helpers ────

function makeChain(resolvedValue) {
  const chain = {
    then: (resolve) => resolve(resolvedValue),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }
  return chain
}

async function getResponseText(res) {
  if (res.text) return res.text()
  if (res.body) {
    const chunks = []
    for await (const chunk of res.body) chunks.push(chunk)
    return Buffer.concat(chunks).toString()
  }
  return ''
}

// ──── Customers export ────

describe('GET /admin/api/export/customers', () => {
  const { GET } = require('../../app/admin/api/export/customers/route')

  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns CSV with correct headers', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = {
      from: jest.fn().mockImplementation((table) => {
        if (table === 'customers') return makeChain({ data: [], error: null })
        return makeChain({ data: [], error: null })
      }),
    }
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/csv/)
    expect(res.headers.get('content-disposition')).toMatch(/attachment/)
    const text = await getResponseText(res)
    expect(text.split('\r\n')[0]).toBe('Name,Email,Phone,Orders,Completed,Total Paid,Repeat,Joined')
  })

  it('queries customers with org filter', async () => {
    getSessionOrgId.mockResolvedValue('org-42')
    const customersChain = makeChain({ data: [], error: null })
    const supabase = { from: jest.fn().mockReturnValue(customersChain) }
    getSupabaseAdmin.mockReturnValue(supabase)

    await GET()
    expect(supabase.from).toHaveBeenCalledWith('customers')
    expect(customersChain.eq).toHaveBeenCalledWith('organization_id', 'org-42')
  })

  it('includes one data row per customer', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const customers = [
      { id: 'c-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', phone: '555-1234', created_at: '2026-01-01T00:00:00Z' },
    ]
    const supabase = {
      from: jest.fn().mockImplementation((table) => {
        if (table === 'customers') return makeChain({ data: customers, error: null })
        return makeChain({ data: [], error: null })
      }),
    }
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    const text = await getResponseText(res)
    const lines = text.split('\r\n').filter(Boolean)
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('Jane Doe')
    expect(lines[1]).toContain('jane@example.com')
  })
})

// ──── Orders export ────

describe('GET /admin/api/export/orders', () => {
  const { GET } = require('../../app/admin/api/export/orders/route')

  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns CSV with correct headers', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = { from: jest.fn().mockReturnValue(makeChain({ data: [], error: null })) }
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    expect(res.status).toBe(200)
    const text = await getResponseText(res)
    const headerRow = text.split('\r\n')[0]
    expect(headerRow).toContain('Order #')
    expect(headerRow).toContain('Status')
    expect(headerRow).toContain('Total Paid')
  })

  it('queries orders with org filter', async () => {
    getSessionOrgId.mockResolvedValue('org-5')
    const ordersChain = makeChain({ data: [], error: null })
    const supabase = { from: jest.fn().mockReturnValue(ordersChain) }
    getSupabaseAdmin.mockReturnValue(supabase)

    await GET()
    expect(ordersChain.eq).toHaveBeenCalledWith('organization_id', 'org-5')
  })
})

// ──── Reviews export ────

describe('GET /admin/api/export/reviews', () => {
  const { GET } = require('../../app/admin/api/export/reviews/route')

  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns CSV with correct headers', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = { from: jest.fn().mockReturnValue(makeChain({ data: [], error: null })) }
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    expect(res.status).toBe(200)
    const text = await getResponseText(res)
    expect(text.split('\r\n')[0]).toBe('Rating,Customer,Quote ID,Device,Repair Type,Comment,Source,Date')
  })

  it('includes one data row per review', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const reviews = [
      {
        rating: 5,
        comment: 'Great service!',
        source: 'email_link',
        created_at: '2026-05-01T00:00:00Z',
        quote_requests: { quote_id: 'RCQ-1', first_name: 'Alice', last_name: null, brand_name: 'Apple', model_name: 'iPhone 14', repair_type_key: 'screen_repair' },
      },
    ]
    const supabase = { from: jest.fn().mockReturnValue(makeChain({ data: reviews, error: null })) }
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    const text = await getResponseText(res)
    const lines = text.split('\r\n').filter(Boolean)
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('5')
    expect(lines[1]).toContain('Alice')
    expect(lines[1]).toContain('Apple iPhone 14')
    expect(lines[1]).toContain('Great service!')
  })

  it('escapes commas and quotes in CSV fields', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const reviews = [
      {
        rating: 4,
        comment: 'Fast, friendly, and "excellent" service',
        source: 'web',
        created_at: '2026-05-01T00:00:00Z',
        quote_requests: { quote_id: 'RCQ-2', first_name: 'Bob', last_name: null, brand_name: null, model_name: null, repair_type_key: null },
      },
    ]
    const supabase = { from: jest.fn().mockReturnValue(makeChain({ data: reviews, error: null })) }
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    const text = await getResponseText(res)
    expect(text).toContain('"Fast, friendly, and ""excellent"" service"')
  })
})
