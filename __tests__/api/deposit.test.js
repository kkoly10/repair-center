/**
 * Multi-tenant safety + idempotency: POST /admin/api/quotes/[quoteId]/deposit
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { POST } = require('../../app/admin/api/quotes/[quoteId]/deposit/route')

// Build a supabase mock that returns sequential values from the `maybySingleQueue`
// for each .maybeSingle() call in order (quote lookup, order lookup, payment lookup, etc.)
function makeChain({ maybySingleQueue = [], insertError = null, updateError = null } = {}) {
  const eqFilters = []
  let callCount = 0

  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: updateError }),
      }),
    }),
    insert: jest.fn().mockResolvedValue({ error: insertError }),
    eq: jest.fn().mockImplementation((col, val) => { eqFilters.push({ col, val }); return chain }),
    maybeSingle: jest.fn().mockImplementation(() => {
      const result = maybySingleQueue[callCount] ?? { data: null, error: null }
      callCount++
      return Promise.resolve(result)
    }),
  }

  return { chain, eqFilters }
}

function makeCtx(quoteId) {
  return { params: Promise.resolve({ quoteId }) }
}

describe('POST /admin/api/quotes/[quoteId]/deposit', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))

    const res = await POST({}, makeCtx('RCQ-001'))

    expect(res.status).toBe(401)
  })

  it('returns 404 when quote does not belong to session org', async () => {
    const { chain } = makeChain({
      maybySingleQueue: [{ data: null, error: null }], // quote not found
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST({}, makeCtx('RCQ-org-b'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toMatch(/quote not found/i)
  })

  it('org isolation: includes organization_id filter on quote lookup', async () => {
    const { chain, eqFilters } = makeChain({
      maybySingleQueue: [{ data: null, error: null }],
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    await POST({}, makeCtx('RCQ-001'))

    expect(eqFilters).toContainEqual({ col: 'organization_id', val: 'org-a' })
  })

  it('returns 400 when no deposit is required (amount is 0)', async () => {
    const { chain } = makeChain({
      maybySingleQueue: [
        { data: { id: 'qr-1' }, error: null },
        { data: { id: 'ro-1', inspection_deposit_required: 0, inspection_deposit_paid_at: null }, error: null },
      ],
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST({}, makeCtx('RCQ-001'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/no deposit is required/i)
  })

  it('returns 400 when no deposit is required (amount is null)', async () => {
    const { chain } = makeChain({
      maybySingleQueue: [
        { data: { id: 'qr-1' }, error: null },
        { data: { id: 'ro-1', inspection_deposit_required: null, inspection_deposit_paid_at: null }, error: null },
      ],
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST({}, makeCtx('RCQ-001'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/no deposit is required/i)
  })

  it('returns 400 when deposit already paid (payment record + timestamp both present)', async () => {
    const { chain } = makeChain({
      maybySingleQueue: [
        { data: { id: 'qr-1' }, error: null },
        { data: { id: 'ro-1', inspection_deposit_required: '25.00', inspection_deposit_paid_at: '2026-05-12T10:00:00Z' }, error: null },
        { data: { id: 'pay-1', paid_at: '2026-05-12T10:00:00Z' }, error: null },
      ],
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST({}, makeCtx('RCQ-001'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/already marked as paid/i)
  })

  it('returns 400 when order timestamp is set even without a payment record', async () => {
    const { chain } = makeChain({
      maybySingleQueue: [
        { data: { id: 'qr-1' }, error: null },
        { data: { id: 'ro-1', inspection_deposit_required: '25.00', inspection_deposit_paid_at: '2026-05-12T10:00:00Z' }, error: null },
        { data: null, error: null }, // no payment record, but timestamp is set
      ],
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST({}, makeCtx('RCQ-001'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/already marked as paid/i)
  })

  it('happy path: inserts payment row and updates order timestamp, returns ok', async () => {
    const { chain } = makeChain({
      maybySingleQueue: [
        { data: { id: 'qr-1' }, error: null },
        { data: { id: 'ro-1', inspection_deposit_required: '25.00', inspection_deposit_paid_at: null }, error: null },
        { data: null, error: null }, // no prior payment
      ],
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST({}, makeCtx('RCQ-001'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    // Must insert a payment row with the correct fields
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-a',
        payment_kind: 'inspection_deposit',
        provider: 'manual',
        status: 'paid',
        amount: 25,
      })
    )
  })

  it('partial-state recovery: payment exists but timestamp null → returns ok without inserting duplicate', async () => {
    const { chain } = makeChain({
      maybySingleQueue: [
        { data: { id: 'qr-1' }, error: null },
        { data: { id: 'ro-1', inspection_deposit_required: '25.00', inspection_deposit_paid_at: null }, error: null },
        { data: { id: 'pay-1', paid_at: '2026-05-10T09:00:00Z' }, error: null }, // payment exists
      ],
    })
    getSupabaseAdmin.mockReturnValue(chain)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST({}, makeCtx('RCQ-001'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    // Must NOT insert a new payment row
    expect(chain.insert).not.toHaveBeenCalled()
  })
})
