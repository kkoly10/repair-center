/**
 * Multi-tenant safety: PATCH /admin/api/pricing/[ruleId]
 *
 * Invariant: the update query MUST include .eq('organization_id', sessionOrgId).
 * Without it, an admin from Org A could overwrite Org B's pricing rules.
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { PATCH } = require('../../app/admin/api/pricing/[ruleId]/route')

function makeChain(singleResult = { data: null, error: null }) {
  const eqFilters = []
  const updateArgs = []

  const chain = {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockImplementation((data) => { updateArgs.push(data); return chain }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockImplementation((col, val) => { eqFilters.push({ col, val }); return chain }),
    single: jest.fn().mockResolvedValue(singleResult),
    maybeSingle: jest.fn().mockResolvedValue(singleResult),
  }

  return { chain, eqFilters, updateArgs }
}

function makeRequest(body) {
  return { json: async () => body }
}

function makeCtx(ruleId) {
  return { params: Promise.resolve({ ruleId }) }
}

describe('PATCH /admin/api/pricing/[ruleId] — org isolation', () => {
  afterEach(() => jest.clearAllMocks())

  it('always includes organization_id filter in the update query', async () => {
    const { chain, eqFilters } = makeChain({ data: { id: 'rule-1', price_mode: 'manual' }, error: null })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    await PATCH(makeRequest({ price_mode: 'manual' }), makeCtx('rule-1'))

    expect(eqFilters).toContainEqual({ col: 'organization_id', val: 'org-a' })
  })

  it('returns 404 when the rule does not belong to the session org (cross-org attempt)', async () => {
    // Supabase returns data:null when the org filter doesn't match
    const { chain } = makeChain({ data: null, error: null })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await PATCH(makeRequest({ price_mode: 'fixed', public_price_fixed: '99.99' }), makeCtx('rule-org-b'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toMatch(/not found/i)
  })

  it('rejects unauthenticated requests with 401', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))

    const res = await PATCH(makeRequest({ price_mode: 'manual' }), makeCtx('any'))

    expect(res.status).toBe(401)
  })

  it('rejects invalid price_mode values', async () => {
    const { chain } = makeChain()
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await PATCH(makeRequest({ price_mode: 'hack_mode' }), makeCtx('rule-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/invalid price_mode/i)
  })

  it('clears public price fields when switching to manual mode', async () => {
    const { chain, updateArgs } = makeChain({
      data: { id: 'rule-1', price_mode: 'manual', public_price_fixed: null, public_price_min: null, public_price_max: null, deposit_amount: '10.00', return_shipping_fee: null, warranty_days: 90, active: true },
      error: null,
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    // Client sends a fixed price alongside manual mode — API must clear it
    await PATCH(makeRequest({ price_mode: 'manual', public_price_fixed: '99.99' }), makeCtx('rule-1'))

    expect(updateArgs[0].public_price_fixed).toBeNull()
    expect(updateArgs[0].public_price_min).toBeNull()
    expect(updateArgs[0].public_price_max).toBeNull()
  })

  it('returns the updated rule on success', async () => {
    const updatedRule = { id: 'rule-1', price_mode: 'fixed', public_price_fixed: '149.99', active: true }
    const { chain } = makeChain({ data: updatedRule, error: null })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await PATCH(makeRequest({ price_mode: 'fixed', public_price_fixed: '149.99' }), makeCtx('rule-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.rule.public_price_fixed).toBe('149.99')
  })
})
