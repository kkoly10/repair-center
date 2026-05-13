/**
 * GET /admin/api/quotes/unreviewed-count
 *
 * Invariants:
 *  - 401 if not authenticated
 *  - Returns { count } scoped to session org
 *  - Filters by status = 'submitted'
 *  - Returns 0 when no unreviewed quotes
 *  - org isolation: only counts within session org
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET } = require('../../app/admin/api/quotes/unreviewed-count/route')

function makeSupabaseMock({ count = 0, error = null } = {}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  }
  chain.eq.mockImplementation(function () { return this })
  Object.defineProperty(chain, '_resolve', {
    value: Promise.resolve({ count, error }),
    writable: false,
  })
  // The last .eq() call returns the promise
  let callCount = 0
  chain.eq = jest.fn().mockImplementation(function () {
    callCount++
    if (callCount >= 2) {
      return Promise.resolve({ count, error })
    }
    return this
  })
  chain.select = jest.fn().mockReturnValue(chain)

  return {
    from: jest.fn().mockReturnValue(chain),
    chain,
  }
}

describe('GET /admin/api/quotes/unreviewed-count', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns count of 0 when no unreviewed quotes', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = makeSupabaseMock({ count: 0 })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    const body = await res.json()
    expect(body.count).toBe(0)
  })

  it('returns correct count for unreviewed quotes', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = makeSupabaseMock({ count: 7 })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    const body = await res.json()
    expect(body.count).toBe(7)
  })

  it('filters by organization_id', async () => {
    getSessionOrgId.mockResolvedValue('org-42')
    const supabase = makeSupabaseMock({ count: 3 })
    getSupabaseAdmin.mockReturnValue(supabase)

    await GET()

    expect(supabase.from).toHaveBeenCalledWith('quote_requests')
    expect(supabase.chain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    // Verify eq was called with org filter
    const eqCalls = supabase.chain.eq.mock.calls
    expect(eqCalls.some(([col, val]) => col === 'organization_id' && val === 'org-42')).toBe(true)
  })

  it('filters by status = submitted', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = makeSupabaseMock({ count: 2 })
    getSupabaseAdmin.mockReturnValue(supabase)

    await GET()

    const eqCalls = supabase.chain.eq.mock.calls
    expect(eqCalls.some(([col, val]) => col === 'status' && val === 'submitted')).toBe(true)
  })
})
