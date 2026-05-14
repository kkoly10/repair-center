/**
 * Sprint 34 — Platform Admin Console API tests
 *
 * Invariants:
 *  - All routes return 403 when getPlatformSession throws
 *  - GET /platform/api/stats: aggregates counts + trialUrgent correctly
 *  - GET /platform/api/orgs: merges subscriptions + member counts onto org list
 *  - GET /platform/api/orgs/[orgId]: 404 for missing org; returns detail + usage
 *  - PATCH /platform/api/orgs/[orgId]: 403 guard; suspend; reactivate; extend_trial; unknown → 400
 */

jest.mock('../../lib/platform/getPlatformSession', () => ({ getPlatformSession: jest.fn() }))
jest.mock('../../lib/supabase/admin', () => ({ getSupabaseAdmin: jest.fn() }))
jest.mock('next/headers', () => ({ cookies: jest.fn(() => ({ getAll: () => [] })) }))

const { getPlatformSession } = require('../../lib/platform/getPlatformSession')
const { getSupabaseAdmin }   = require('../../lib/supabase/admin')

const AUTH_ERR = Object.assign(new Error('Platform access denied.'), { status: 403 })

function makeRequest(body = null) {
  return {
    json: async () => body,
    headers: { get: () => null },
  }
}

function makeContext(params) {
  return { params: Promise.resolve(params) }
}

// ─── Helpers to build minimal Supabase chain mocks ───────────────────────────

function chainResolving(result) {
  const c = {
    select:     jest.fn().mockReturnThis(),
    eq:         jest.fn().mockReturnThis(),
    in:         jest.fn().mockReturnThis(),
    order:      jest.fn().mockReturnThis(),
    limit:      jest.fn().mockReturnThis(),
    update:     jest.fn().mockReturnThis(),
    single:     jest.fn().mockResolvedValue(result),
    maybeSingle:jest.fn().mockResolvedValue(result),
  }
  // make the chain itself thenable (for Promise.all awaiting the chain directly)
  c.then = (resolve) => resolve(result)
  return c
}

// ─── GET /platform/api/stats ──────────────────────────────────────────────────

describe('GET /platform/api/stats', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 when platform session fails', async () => {
    getPlatformSession.mockRejectedValue(AUTH_ERR)
    const { GET } = require('../../app/platform/api/stats/route')
    const res = await GET()
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('aggregates status counts and flags urgent trials', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })

    const now = Date.now()
    const orgs = [
      { id: '1', name: 'Org A', slug: 'a', status: 'active',    created_at: new Date(now - 5 * 86400000).toISOString(), trial_ends_at: null },
      { id: '2', name: 'Org B', slug: 'b', status: 'trialing',  created_at: new Date(now - 1 * 86400000).toISOString(), trial_ends_at: new Date(now + 2 * 86400000).toISOString() },
      { id: '3', name: 'Org C', slug: 'c', status: 'trialing',  created_at: new Date(now - 40 * 86400000).toISOString(), trial_ends_at: new Date(now + 10 * 86400000).toISOString() },
      { id: '4', name: 'Org D', slug: 'd', status: 'suspended', created_at: new Date(now - 60 * 86400000).toISOString(), trial_ends_at: null },
    ]

    getSupabaseAdmin.mockReturnValue({
      from: () => ({ select: () => ({ order: () => Promise.resolve({ data: orgs, error: null }) }) }),
    })

    const { GET } = require('../../app/platform/api/stats/route')
    const res  = await GET()
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(json.total).toBe(4)
    expect(json.counts.active).toBe(1)
    expect(json.counts.trialing).toBe(2)
    expect(json.counts.suspended).toBe(1)
    // Only Org B has trial_ends_at within 3 days
    expect(json.trialUrgent).toHaveLength(1)
    expect(json.trialUrgent[0].name).toBe('Org B')
    // Orgs A and B created within 30 days
    expect(json.recentCount).toBe(2)
    expect(json.recentOrgs).toHaveLength(4)
  })
})

// ─── GET /platform/api/orgs ───────────────────────────────────────────────────

describe('GET /platform/api/orgs', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 when platform session fails', async () => {
    getPlatformSession.mockRejectedValue(AUTH_ERR)
    const { GET } = require('../../app/platform/api/orgs/route')
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns org list with member counts merged', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })

    const org = { id: 'org-1', name: 'Shop One', slug: 'shop-one', status: 'active',
      plan_key: null, trial_ends_at: null, created_at: new Date().toISOString(), stripe_customer_id: null }
    const sub = { organization_id: 'org-1', plan_key: 'pro', status: 'active',
      current_period_end: null, cancel_at_period_end: false }

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation((table) => {
        if (table === 'organizations')
          return { select: () => ({ order: () => Promise.resolve({ data: [org], error: null }) }) }
        if (table === 'organization_subscriptions')
          return { select: () => Promise.resolve({ data: [sub], error: null }) }
        if (table === 'organization_members')
          return { select: () => ({ eq: () => Promise.resolve({ data: [
            { organization_id: 'org-1' },
            { organization_id: 'org-1' },
          ], error: null }) }) }
        return chainResolving({ data: [], error: null })
      }),
    })

    const { GET } = require('../../app/platform/api/orgs/route')
    const res  = await GET()
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(json.orgs).toHaveLength(1)
    expect(json.orgs[0].memberCount).toBe(2)
    expect(json.orgs[0].subscription.plan_key).toBe('pro')
  })
})

// ─── GET /platform/api/orgs/[orgId] ──────────────────────────────────────────

describe('GET /platform/api/orgs/[orgId]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 when platform session fails', async () => {
    getPlatformSession.mockRejectedValue(AUTH_ERR)
    const { GET } = require('../../app/platform/api/orgs/[orgId]/route')
    const res = await GET(makeRequest(), makeContext({ orgId: 'org-1' }))
    expect(res.status).toBe(403)
  })

  it('returns 404 for unknown org', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation((table) => {
        if (table === 'organizations') return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } }) }) }),
        }
        return chainResolving({ data: [], error: null, count: 0 })
      }),
    })
    const { GET } = require('../../app/platform/api/orgs/[orgId]/route')
    const res = await GET(makeRequest(), makeContext({ orgId: 'missing' }))
    expect(res.status).toBe(404)
  })

  it('returns org detail with usage counts and members', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })

    const org = { id: 'org-1', name: 'Shop', slug: 'shop', status: 'active',
      plan_key: null, trial_ends_at: null, created_at: new Date().toISOString(),
      stripe_customer_id: null, updated_at: new Date().toISOString() }
    const member = { id: 'm1', role: 'owner', status: 'active', user_id: 'u1' }
    const profile = { id: 'u1', full_name: 'Alice', email: 'alice@example.com' }

    let callIndex = 0
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation((table) => {
        if (table === 'organizations') return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: org, error: null }) }) }),
        }
        if (table === 'organization_subscriptions') return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
        }
        if (table === 'organization_members') return {
          select: () => ({ eq: () => Promise.resolve({ data: [member], error: null }) }),
        }
        if (table === 'profiles') return {
          select: () => ({ in: () => Promise.resolve({ data: [profile], error: null }) }),
        }
        if (table === 'quote_requests') {
          callIndex++
          if (callIndex === 1) return {
            select: () => ({ eq: () => Promise.resolve({ count: 12, error: null }) }),
          }
          return {
            select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }),
          }
        }
        return { select: () => ({ eq: () => Promise.resolve({ count: 3, error: null }) }) }
      }),
    })

    const { GET } = require('../../app/platform/api/orgs/[orgId]/route')
    const res  = await GET(makeRequest(), makeContext({ orgId: 'org-1' }))
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(json.org.name).toBe('Shop')
    expect(json.members[0].profile.email).toBe('alice@example.com')
    expect(json.usage.quotes).toBe(12)
  })
})

// ─── PATCH /platform/api/orgs/[orgId] ────────────────────────────────────────

describe('PATCH /platform/api/orgs/[orgId]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 when platform session fails', async () => {
    getPlatformSession.mockRejectedValue(AUTH_ERR)
    const { PATCH } = require('../../app/platform/api/orgs/[orgId]/route')
    const res = await PATCH(makeRequest({ action: 'suspend' }), makeContext({ orgId: 'org-1' }))
    expect(res.status).toBe(403)
  })

  it('returns 404 for unknown org', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })
    getSupabaseAdmin.mockReturnValue({
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } }) }) }),
      }),
    })
    const { PATCH } = require('../../app/platform/api/orgs/[orgId]/route')
    const res = await PATCH(makeRequest({ action: 'suspend' }), makeContext({ orgId: 'bad' }))
    expect(res.status).toBe(404)
  })

  it('returns 400 for unknown action', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })
    getSupabaseAdmin.mockReturnValue({
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'org-1', status: 'active', trial_ends_at: null }, error: null }) }) }),
      }),
    })
    const { PATCH } = require('../../app/platform/api/orgs/[orgId]/route')
    const res = await PATCH(makeRequest({ action: 'delete_all_data' }), makeContext({ orgId: 'org-1' }))
    expect(res.status).toBe(400)
  })

  it('suspend: sets status to suspended', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })

    const updateMock = jest.fn().mockReturnThis()
    const eqMock     = jest.fn().mockResolvedValue({ error: null })

    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation((table) => {
        if (table === 'organizations') return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'org-1', status: 'active', trial_ends_at: null }, error: null }) }) }),
          update: (vals) => {
            expect(vals.status).toBe('suspended')
            return { eq: () => Promise.resolve({ error: null }) }
          },
        }
        return chainResolving({ data: null, error: null })
      }),
    })

    const { PATCH } = require('../../app/platform/api/orgs/[orgId]/route')
    const res  = await PATCH(makeRequest({ action: 'suspend' }), makeContext({ orgId: 'org-1' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.status).toBe('suspended')
  })

  it('extend_trial: extends trial_ends_at and sets status to trialing', async () => {
    getPlatformSession.mockResolvedValue({ email: 'admin@example.com' })

    let updatedVals = null
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn().mockImplementation((table) => {
        if (table === 'organizations') return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'org-1', status: 'suspended', trial_ends_at: null }, error: null }) }) }),
          update: (vals) => { updatedVals = vals; return { eq: () => Promise.resolve({ error: null }) } },
        }
        return chainResolving({ data: null, error: null })
      }),
    })

    const { PATCH } = require('../../app/platform/api/orgs/[orgId]/route')
    const res  = await PATCH(makeRequest({ action: 'extend_trial', days: 7 }), makeContext({ orgId: 'org-1' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('trialing')
    expect(new Date(json.trial_ends_at).getTime()).toBeGreaterThan(Date.now())
    expect(updatedVals.status).toBe('trialing')
    expect(updatedVals.trial_ends_at).toBeDefined()
  })
})
