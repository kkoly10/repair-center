/**
 * Sprint 22 — Pricing rule creation + deletion + catalog endpoint
 */

jest.mock('../../lib/supabase/admin', () => ({ getSupabaseAdmin: jest.fn() }))
jest.mock('../../lib/admin/getSessionOrgId', () => ({ getSessionOrgId: jest.fn() }))

const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')

const ORG_ID = 'org-111'
const OTHER_ORG = 'org-999'
const MODEL_ID = 'model-aaa'
const REPAIR_TYPE_ID = 'rt-bbb'
const RULE_ID = 'rule-ccc'

function makeRequest(body = {}, method = 'POST') {
  return { json: async () => body, method }
}

function makeContext(params = {}) {
  return { params: Promise.resolve(params) }
}

// ---------------------------------------------------------------------------
// GET /admin/api/catalog
// ---------------------------------------------------------------------------
describe('GET /admin/api/catalog', () => {
  const { GET } = require('../../app/admin/api/catalog/route')

  beforeEach(() => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns models, repairTypes, and existingKeys', async () => {
    const models = [{ id: MODEL_ID, model_name: 'iPhone 15', repair_catalog_brands: { brand_name: 'Apple' } }]
    const repairTypes = [{ id: REPAIR_TYPE_ID, repair_name: 'Screen Replacement' }]
    const existingRules = [{ model_id: MODEL_ID, repair_type_id: REPAIR_TYPE_ID }]

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn((table) => {
        if (table === 'repair_catalog_models') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: models, error: null }),
          }
        }
        if (table === 'repair_types') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: repairTypes, error: null }),
          }
        }
        // pricing_rules
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: (resolve) => resolve({ data: existingRules, error: null }),
        }
      }),
    })

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.models).toEqual(models)
    expect(body.repairTypes).toEqual(repairTypes)
    expect(body.existingKeys).toContain(`${MODEL_ID}:${REPAIR_TYPE_ID}`)
  })

  it('returns empty existingKeys when org has no rules', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn((table) => {
        if (table === 'repair_catalog_models') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) }
        }
        if (table === 'repair_types') {
          return { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: (resolve) => resolve({ data: [], error: null }),
        }
      }),
    })

    const res = await GET()
    const body = await res.json()
    expect(body.existingKeys).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// POST /admin/api/pricing
// ---------------------------------------------------------------------------
describe('POST /admin/api/pricing', () => {
  const { POST } = require('../../app/admin/api/pricing/route')

  beforeEach(() => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await POST(makeRequest({ modelId: MODEL_ID, repairTypeId: REPAIR_TYPE_ID }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when modelId is missing', async () => {
    getSupabaseAdmin.mockReturnValue({ from: jest.fn() })
    const res = await POST(makeRequest({ repairTypeId: REPAIR_TYPE_ID }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/modelId/)
  })

  it('returns 400 when repairTypeId is missing', async () => {
    getSupabaseAdmin.mockReturnValue({ from: jest.fn() })
    const res = await POST(makeRequest({ modelId: MODEL_ID }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/repairTypeId/)
  })

  it('returns 400 for invalid priceMode', async () => {
    getSupabaseAdmin.mockReturnValue({ from: jest.fn() })
    const res = await POST(makeRequest({ modelId: MODEL_ID, repairTypeId: REPAIR_TYPE_ID, priceMode: 'bogus' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/priceMode/i)
  })

  it('returns 404 when model does not exist', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn((table) => {
        if (table === 'repair_catalog_models') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }
        }
        // repair_types
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: REPAIR_TYPE_ID }, error: null }) }
      }),
    })
    const res = await POST(makeRequest({ modelId: MODEL_ID, repairTypeId: REPAIR_TYPE_ID }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/model/i)
  })

  it('returns 409 on duplicate rule', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn((table) => {
        if (table === 'repair_catalog_models') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: MODEL_ID }, error: null }) }
        }
        if (table === 'repair_types') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: REPAIR_TYPE_ID }, error: null }) }
        }
        // pricing_rules
        return { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'unique violation' } }) }
      }),
    })
    const res = await POST(makeRequest({ modelId: MODEL_ID, repairTypeId: REPAIR_TYPE_ID }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already exists/i)
  })

  it('returns 201 and the new rule on success', async () => {
    const newRule = { id: RULE_ID, model_id: MODEL_ID, repair_type_id: REPAIR_TYPE_ID, price_mode: 'manual', active: true }
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn((table) => {
        if (table === 'repair_catalog_models') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: MODEL_ID }, error: null }) }
        }
        if (table === 'repair_types') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: REPAIR_TYPE_ID }, error: null }) }
        }
        return { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: newRule, error: null }) }
      }),
    })
    const res = await POST(makeRequest({ modelId: MODEL_ID, repairTypeId: REPAIR_TYPE_ID, priceMode: 'manual' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.rule.id).toBe(RULE_ID)
  })

  it('inserts with correct organization_id', async () => {
    const insertMock = jest.fn().mockReturnThis()
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn((table) => {
        if (table === 'repair_catalog_models') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: MODEL_ID }, error: null }) }
        }
        if (table === 'repair_types') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: REPAIR_TYPE_ID }, error: null }) }
        }
        return { insert: insertMock, select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: RULE_ID }, error: null }) }
      }),
    })
    await POST(makeRequest({ modelId: MODEL_ID, repairTypeId: REPAIR_TYPE_ID }))
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ organization_id: ORG_ID, model_id: MODEL_ID, repair_type_id: REPAIR_TYPE_ID }))
  })
})

// ---------------------------------------------------------------------------
// DELETE /admin/api/pricing/[ruleId]
// ---------------------------------------------------------------------------
describe('DELETE /admin/api/pricing/[ruleId]', () => {
  const { DELETE: DELETE_HANDLER } = require('../../app/admin/api/pricing/[ruleId]/route')

  beforeEach(() => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await DELETE_HANDLER(makeRequest({}, 'DELETE'), makeContext({ ruleId: RULE_ID }))
    expect(res.status).toBe(401)
  })

  it('returns 404 for cross-org rule', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })
    const res = await DELETE_HANDLER(makeRequest({}, 'DELETE'), makeContext({ ruleId: RULE_ID }))
    expect(res.status).toBe(404)
  })

  it('deletes the rule and returns ok: true', async () => {
    let callCount = 0
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => {
        callCount++
        if (callCount === 1) {
          // lookup query
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: RULE_ID }, error: null }),
          }
        }
        // delete query
        return {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: (resolve) => resolve({ error: null }),
        }
      }),
    })
    const res = await DELETE_HANDLER(makeRequest({}, 'DELETE'), makeContext({ ruleId: RULE_ID }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('enforces org_id filter on lookup', async () => {
    const eqMock = jest.fn().mockReturnThis()
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: eqMock,
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })
    await DELETE_HANDLER(makeRequest({}, 'DELETE'), makeContext({ ruleId: RULE_ID }))
    const eqCalls = eqMock.mock.calls
    const hasOrgFilter = eqCalls.some(([col, val]) => col === 'organization_id' && val === ORG_ID)
    expect(hasOrgFilter).toBe(true)
  })
})
