/**
 * Sprint 37 onboarding tests
 *
 * Invariants:
 *  - GET /admin/api/onboarding/status: 401 if not auth; returns steps shape; handles nulls safely
 *  - POST /admin/api/onboarding/dismiss: 401 if not auth; writes onboarding_dismissed_at; returns ok
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeDb({
  branding = null,
  pricingCount = 0,
  payment = null,
  estimatesCount = 0,
  org = {},
  updateError = null,
} = {}) {
  function countChain(n) {
    const c = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() }
    c.then = (resolve) => Promise.resolve({ data: null, error: null, count: n }).then(resolve)
    return c
  }

  function dataChain(data, extra = {}) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
      single: jest.fn().mockResolvedValue({ data, error: null }),
      ...extra,
    }
  }

  const orgData = { onboarding_dismissed_at: null, ...org }

  return {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'pricing_rules') return countChain(pricingCount)
      if (table === 'quote_estimates') return countChain(estimatesCount)
      if (table === 'organization_branding') return dataChain(branding)
      if (table === 'organization_payment_settings') return dataChain(payment)
      if (table === 'organizations') {
        const chain = dataChain(orgData)
        chain.update = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: updateError }),
        })
        return chain
      }
      return dataChain(null)
    }),
  }
}

// ── GET /admin/api/onboarding/status ─────────────────────────────────────────

describe('GET /admin/api/onboarding/status', () => {
  const { GET } = require('../../app/admin/api/onboarding/status/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns all steps false for a brand-new org', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb())

    const res = await GET()
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(json.steps.accountCreated).toBe(true)
    expect(json.steps.profileComplete).toBe(false)
    expect(json.steps.pricingComplete).toBe(false)
    expect(json.steps.paymentComplete).toBe(false)
    expect(json.steps.estimatesSent).toBe(false)
    expect(json.dismissedAt).toBeNull()
  })

  it('marks profileComplete true when primary_color is set', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({ branding: { primary_color: '#16a34a', logo_url: null, hero_headline: null } }))

    const res = await GET()
    const json = await res.json()
    expect(json.steps.profileComplete).toBe(true)
  })

  it('marks profileComplete true when only logo_url is set', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({ branding: { primary_color: null, logo_url: 'https://example.com/logo.png', hero_headline: null } }))

    const res = await GET()
    const json = await res.json()
    expect(json.steps.profileComplete).toBe(true)
  })

  it('marks pricingComplete true when active pricing rules exist', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({ pricingCount: 3 }))

    const res = await GET()
    const json = await res.json()
    expect(json.steps.pricingComplete).toBe(true)
  })

  it('marks paymentComplete true when manual_payment_instructions is set', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({
      payment: { payment_mode: 'manual', manual_payment_instructions: 'Cash or Venmo' },
    }))

    const res = await GET()
    const json = await res.json()
    expect(json.steps.paymentComplete).toBe(true)
  })

  it('marks paymentComplete true when payment_mode is stripe_connect', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({
      payment: { payment_mode: 'stripe_connect', manual_payment_instructions: null },
    }))

    const res = await GET()
    const json = await res.json()
    expect(json.steps.paymentComplete).toBe(true)
  })

  it('marks estimatesSent true when a sent estimate exists', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({ estimatesCount: 1 }))

    const res = await GET()
    const json = await res.json()
    expect(json.steps.estimatesSent).toBe(true)
  })

  it('returns dismissedAt when org has onboarding_dismissed_at set', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const ts = '2026-05-15T00:00:00Z'
    getSupabaseAdmin.mockReturnValue(makeDb({ org: { onboarding_dismissed_at: ts } }))

    const res = await GET()
    const json = await res.json()
    expect(json.dismissedAt).toBe(ts)
  })

  it('handles missing branding row gracefully', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({ branding: null }))

    const res = await GET()
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.steps.profileComplete).toBe(false)
  })

  it('returns 500 when a DB query throws', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb()
    db.from = jest.fn().mockImplementation((table) => {
      if (table === 'organizations') {
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }) }
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }), then: (r) => Promise.resolve({ data: null, error: null, count: 0 }).then(r) }
    })
    getSupabaseAdmin.mockReturnValue(db)

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ── POST /admin/api/onboarding/dismiss ───────────────────────────────────────

describe('POST /admin/api/onboarding/dismiss', () => {
  const { POST } = require('../../app/admin/api/onboarding/dismiss/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('calls update on organizations with onboarding_dismissed_at', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb()
    getSupabaseAdmin.mockReturnValue(db)

    await POST()

    expect(db.from).toHaveBeenCalledWith('organizations')
    const orgChain = db.from.mock.results[0].value
    expect(orgChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_dismissed_at: expect.any(String) })
    )
  })

  it('returns ok:true on success', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb())

    const res = await POST()
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })

  it('returns 500 when DB update fails', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    getSupabaseAdmin.mockReturnValue(makeDb({ updateError: { message: 'DB write failed' } }))

    const res = await POST()
    expect(res.status).toBe(500)
  })
})
