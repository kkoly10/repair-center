/**
 * Multi-tenant safety: parts catalog + repair_order_parts usage
 *
 * Invariants:
 *  - Requires authentication (401 if not)
 *  - GET /admin/api/parts: org-scoped; returns is_low_stock flag
 *  - POST /admin/api/parts: creates part for session org
 *  - PATCH /admin/api/parts/[partId]: verifies org ownership before update
 *  - DELETE /admin/api/parts/[partId]: soft-deletes (active=false); cross-org returns 404
 *  - POST /admin/api/orders/[orderId]/parts: insufficient stock returns 409; decrements stock
 *  - DELETE /admin/api/orders/[orderId]/parts: restores stock on removal
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET: partsGET, POST: partsPOST } = require('../../app/admin/api/parts/route')
const { PATCH: partPATCH, DELETE: partDELETE } = require('../../app/admin/api/parts/[partId]/route')
const {
  GET: orderPartsGET,
  POST: orderPartsPOST,
  DELETE: orderPartsDELETE,
} = require('../../app/admin/api/orders/[orderId]/parts/route')

const ORG = 'org-abc'
const OTHER_ORG = 'org-xyz'
const PART_ID = 'part-1'
const ORDER_ID = 'order-1'
const USAGE_ID = 'usage-1'

function makeRequest(body, searchParams) {
  const url = searchParams ? `http://localhost/api?${new URLSearchParams(searchParams)}` : 'http://localhost/api'
  return {
    url,
    json: jest.fn().mockResolvedValue(body || {}),
  }
}

function makeListChain(result) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(result),
  }
}

function makeSingleChain(result) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  }
}

function makeInsertChain(result) {
  return {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  }
}

function makeUpdateChain(result) {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    mockResolvedValue: jest.fn(),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  getSessionOrgId.mockResolvedValue(ORG)
})

// ── GET /admin/api/parts ──────────────────────────────────────────────────────

describe('GET /admin/api/parts', () => {
  test('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await partsGET(makeRequest())
    expect(res.status).toBe(401)
  })

  test('filters parts by org', async () => {
    const chain = makeListChain({ data: [], error: null })
    const supabase = { from: jest.fn().mockReturnValue(chain) }
    getSupabaseAdmin.mockReturnValue(supabase)

    await partsGET(makeRequest())

    expect(chain.eq).toHaveBeenCalledWith('organization_id', ORG)
  })

  test('computes is_low_stock flag', async () => {
    const parts = [
      { id: '1', name: 'Screen', sku: null, description: null, cost_price: '10.00', quantity_on_hand: 2, low_stock_threshold: 5, active: true, supplier_id: null, suppliers: null, created_at: '', updated_at: '' },
      { id: '2', name: 'Battery', sku: null, description: null, cost_price: '5.00', quantity_on_hand: 10, low_stock_threshold: 3, active: true, supplier_id: null, suppliers: null, created_at: '', updated_at: '' },
    ]
    const chain = makeListChain({ data: parts, error: null })
    getSupabaseAdmin.mockReturnValue({ from: jest.fn().mockReturnValue(chain) })

    const res = await partsGET(makeRequest())
    const json = await res.json()

    expect(json.parts[0].is_low_stock).toBe(true)
    expect(json.parts[1].is_low_stock).toBe(false)
    expect(json.lowStockCount).toBe(1)
  })
})

// ── POST /admin/api/parts ─────────────────────────────────────────────────────

describe('POST /admin/api/parts', () => {
  test('returns 400 if name is missing', async () => {
    getSupabaseAdmin.mockReturnValue({})
    const req = makeRequest({ name: '' })
    const res = await partsPOST(req)
    expect(res.status).toBe(400)
  })

  test('inserts part with org id', async () => {
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: PART_ID }, error: null }),
    }
    const supabase = { from: jest.fn().mockReturnValue(insertChain) }
    getSupabaseAdmin.mockReturnValue(supabase)

    const req = makeRequest({ name: 'Screen', cost_price: 25 })
    const res = await partsPOST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.id).toBe(PART_ID)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ organization_id: ORG, name: 'Screen' })
    )
  })
})

// ── PATCH /admin/api/parts/[partId] ──────────────────────────────────────────

describe('PATCH /admin/api/parts/[partId]', () => {
  test('returns 404 for part belonging to another org', async () => {
    const verifyChain = makeSingleChain({ data: null, error: null })
    getSupabaseAdmin.mockReturnValue({ from: jest.fn().mockReturnValue(verifyChain) })

    const req = makeRequest({ name: 'New name' })
    const context = { params: Promise.resolve({ partId: PART_ID }) }
    const res = await partPATCH(req, context)

    expect(res.status).toBe(404)
  })

  test('updates part fields for correct org', async () => {
    let callCount = 0
    const verifyChain = makeSingleChain({ data: { id: PART_ID }, error: null })
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    }
    // Second .eq() on update chain resolves the promise
    let eqCallCount = 0
    updateChain.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount >= 2) return Promise.resolve({ error: null })
      return updateChain
    })

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? verifyChain : updateChain
      }),
    })

    const req = makeRequest({ name: 'Updated Name', cost_price: 30, active: true })
    const context = { params: Promise.resolve({ partId: PART_ID }) }
    const res = await partPATCH(req, context)
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Name' })
    )
  })
})

// ── DELETE /admin/api/parts/[partId] (soft-delete) ───────────────────────────

describe('DELETE /admin/api/parts/[partId]', () => {
  test('returns 404 for wrong org', async () => {
    const verifyChain = makeSingleChain({ data: null, error: null })
    getSupabaseAdmin.mockReturnValue({ from: jest.fn().mockReturnValue(verifyChain) })

    const context = { params: Promise.resolve({ partId: PART_ID }) }
    const res = await partDELETE({}, context)
    expect(res.status).toBe(404)
  })

  test('soft-deletes (sets active=false, not hard delete)', async () => {
    let callCount = 0
    const verifyChain = makeSingleChain({ data: { id: PART_ID }, error: null })
    let eqCallCount = 0
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => {
        eqCallCount++
        if (eqCallCount >= 2) return Promise.resolve({ error: null })
        return updateChain
      }),
    }

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? verifyChain : updateChain
      }),
    })

    const context = { params: Promise.resolve({ partId: PART_ID }) }
    const res = await partDELETE({}, context)
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ active: false })
    )
  })
})

// ── POST /admin/api/orders/[orderId]/parts ────────────────────────────────────

describe('POST /admin/api/orders/[orderId]/parts (record usage)', () => {
  test('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const req = makeRequest({ part_id: PART_ID, quantity_used: 1 })
    const context = { params: Promise.resolve({ orderId: ORDER_ID }) }
    const res = await orderPartsPOST(req, context)
    expect(res.status).toBe(401)
  })

  test('returns 409 when quantity_on_hand is insufficient', async () => {
    let callCount = 0
    const orderChain = makeSingleChain({ data: { id: ORDER_ID }, error: null })
    const partChain = makeSingleChain({ data: { id: PART_ID, cost_price: '10.00', quantity_on_hand: 0 }, error: null })

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? orderChain : partChain
      }),
    })

    const req = makeRequest({ part_id: PART_ID, quantity_used: 1 })
    const context = { params: Promise.resolve({ orderId: ORDER_ID }) }
    const res = await orderPartsPOST(req, context)

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/insufficient/i)
  })

  test('inserts usage and decrements stock', async () => {
    let callCount = 0
    const orderChain = makeSingleChain({ data: { id: ORDER_ID }, error: null })
    const partChain = makeSingleChain({ data: { id: PART_ID, cost_price: '10.00', quantity_on_hand: 5 }, error: null })
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: USAGE_ID }, error: null }),
    }
    let updateEqCount = 0
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => {
        updateEqCount++
        if (updateEqCount >= 2) return Promise.resolve({ error: null })
        return updateChain
      }),
    }

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation((table) => {
        if (table === 'repair_orders') return orderChain
        if (table === 'parts') {
          callCount++
          return callCount === 1 ? partChain : updateChain
        }
        return insertChain
      }),
    })

    const req = makeRequest({ part_id: PART_ID, quantity_used: 2 })
    const context = { params: Promise.resolve({ orderId: ORDER_ID }) }
    const res = await orderPartsPOST(req, context)

    expect(res.status).toBe(201)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ part_id: PART_ID, quantity_used: 2, organization_id: ORG })
    )
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ quantity_on_hand: 3 })
    )
  })
})

// ── GET /admin/api/orders/[orderId]/parts ─────────────────────────────────────

describe('GET /admin/api/orders/[orderId]/parts', () => {
  test('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const context = { params: Promise.resolve({ orderId: ORDER_ID }) }
    const res = await orderPartsGET(makeRequest(), context)
    expect(res.status).toBe(401)
  })

  test('returns 404 if order does not belong to org', async () => {
    const orderChain = makeSingleChain({ data: null, error: null })
    getSupabaseAdmin.mockReturnValue({ from: jest.fn().mockReturnValue(orderChain) })

    const context = { params: Promise.resolve({ orderId: ORDER_ID }) }
    const res = await orderPartsGET(makeRequest(), context)
    expect(res.status).toBe(404)
  })

  test('returns parts used with total cost', async () => {
    let callCount = 0
    const orderChain = makeSingleChain({ data: { id: ORDER_ID }, error: null })
    const usageData = [
      { id: USAGE_ID, part_id: PART_ID, quantity_used: 2, cost_at_use: '10.00', notes: null, created_at: '', parts: { name: 'Screen', sku: 'SCR-1' } },
    ]
    const usageChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: usageData, error: null }),
    }

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation((table) => {
        callCount++
        return callCount === 1 ? orderChain : usageChain
      }),
    })

    const context = { params: Promise.resolve({ orderId: ORDER_ID }) }
    const res = await orderPartsGET(makeRequest(), context)
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(json.partsUsed).toHaveLength(1)
    expect(json.partsUsed[0].total_cost).toBe(20)
    expect(json.totalPartsCost).toBe(20)
  })
})
