/**
 * Sprint 38 walk-in intake tests
 *
 * Invariants:
 *  - POST /admin/api/walkin: 401 if not auth
 *  - 400 if firstName missing
 *  - 400 if both phone and email missing
 *  - Finds existing customer by phone → uses their id, no insert
 *  - Customer not found → inserts new customer row
 *  - Inserts quote_request with submission_source='walk_in' and status='approved'
 *  - Inserts repair_order with current_status='received' and intake_received_at set
 *  - Returns { ok: true, quoteId, orderId, orderNumber }
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionContext } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeDb({
  existingCustomer = null,
  insertCustomer = { id: 'cust-new' },
  insertQuote = { id: 'qr-1', quote_id: 'RCQ-0001' },
  insertOrder = { id: 'ord-1', order_number: 'RCO-0001' },
  customerInsertError = null,
} = {}) {
  return {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'customers') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: existingCustomer, error: null }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: insertCustomer, error: customerInsertError }),
          }),
        }
      }
      if (table === 'quote_requests') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: insertQuote, error: null }),
          }),
        }
      }
      if (table === 'repair_orders') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: insertOrder, error: null }),
          }),
        }
      }
      if (table === 'repair_catalog_models' || table === 'repair_types') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  }
}

function makeRequest(body) {
  return { json: () => Promise.resolve(body) }
}

const validBody = {
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-1234',
  email: 'jane@example.com',
  category: 'phone',
  brandName: 'Apple',
  modelName: 'iPhone 13',
  repairDescription: 'Cracked screen',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /admin/api/walkin', () => {
  const { POST } = require('../../app/admin/api/walkin/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionContext.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 when firstName is missing', async () => {
    getSessionContext.mockResolvedValue({ orgId: 'org-1', userId: 'user-1' })
    const res = await POST(makeRequest({ phone: '555-1234', repairDescription: 'Screen crack' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/firstName/i)
  })

  it('returns 400 when both phone and email are missing', async () => {
    getSessionContext.mockResolvedValue({ orgId: 'org-1', userId: 'user-1' })
    const res = await POST(makeRequest({ firstName: 'Jane', repairDescription: 'Screen crack' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/phone or email/i)
  })

  it('uses existing customer id when found by phone', async () => {
    getSessionContext.mockResolvedValue({ orgId: 'org-1', userId: 'user-1' })
    const db = makeDb({ existingCustomer: { id: 'cust-existing' } })
    getSupabaseAdmin.mockReturnValue(db)

    await POST(makeRequest(validBody))

    // customers.insert should NOT have been called
    const customersChain = db.from.mock.calls
      .map((c, i) => ({ table: c[0], result: db.from.mock.results[i].value }))
      .filter(c => c.table === 'customers')
    const insertCalls = customersChain.filter(c => c.result.insert?.mock?.calls?.length > 0)
    expect(insertCalls).toHaveLength(0)
  })

  it('inserts a new customer when none is found by phone or email', async () => {
    getSessionContext.mockResolvedValue({ orgId: 'org-1', userId: 'user-1' })
    const db = makeDb({ existingCustomer: null, insertCustomer: { id: 'cust-new' } })
    getSupabaseAdmin.mockReturnValue(db)

    await POST(makeRequest(validBody))

    // Find the customers chain that called insert
    const inserted = db.from.mock.calls.some(c => c[0] === 'customers')
    expect(inserted).toBe(true)
    // Verify the insert chain was invoked
    const customerChains = db.from.mock.results
      .filter((_, i) => db.from.mock.calls[i][0] === 'customers')
      .map(r => r.value)
    const insertChain = customerChains.find(c => c.insert.mock.calls.length > 0)
    expect(insertChain).toBeDefined()
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Jane',
        organization_id: 'org-1',
      })
    )
  })

  it('inserts quote_request with submission_source=walk_in and status=approved', async () => {
    getSessionContext.mockResolvedValue({ orgId: 'org-1', userId: 'user-1' })
    const db = makeDb({ existingCustomer: null })
    getSupabaseAdmin.mockReturnValue(db)

    await POST(makeRequest(validBody))

    const qrCallIndex = db.from.mock.calls.findIndex(c => c[0] === 'quote_requests')
    expect(qrCallIndex).toBeGreaterThan(-1)
    const qrChain = db.from.mock.results[qrCallIndex].value
    expect(qrChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        submission_source: 'walk_in',
        status: 'approved',
        organization_id: 'org-1',
        reviewed_by_user_id: 'user-1',
      })
    )
  })

  it('inserts repair_order with current_status=received and intake_received_at set', async () => {
    getSessionContext.mockResolvedValue({ orgId: 'org-1', userId: 'user-1' })
    const db = makeDb({ existingCustomer: null })
    getSupabaseAdmin.mockReturnValue(db)

    await POST(makeRequest(validBody))

    const roCallIndex = db.from.mock.calls.findIndex(c => c[0] === 'repair_orders')
    expect(roCallIndex).toBeGreaterThan(-1)
    const roChain = db.from.mock.results[roCallIndex].value
    expect(roChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        current_status: 'received',
        intake_received_at: expect.any(String),
        organization_id: 'org-1',
      })
    )
  })

  it('returns ok:true with quoteId, orderId, orderNumber on success', async () => {
    getSessionContext.mockResolvedValue({ orgId: 'org-1', userId: 'user-1' })
    getSupabaseAdmin.mockReturnValue(makeDb({
      existingCustomer: null,
      insertQuote: { id: 'qr-1', quote_id: 'RCQ-0001' },
      insertOrder: { id: 'ord-1', order_number: 'RCO-0001' },
    }))

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(json.quoteId).toBe('RCQ-0001')
    expect(json.orderId).toBe('ord-1')
    expect(json.orderNumber).toBe('RCO-0001')
  })
})
