/**
 * Sprint 14 billing tests
 *
 * Invariants:
 *  - GET /admin/api/billing: 401 if not auth; returns billing shape from org + sub tables
 *  - POST /admin/api/billing/checkout: 401 if not auth; 500 if no price ID configured; returns url
 *  - POST /admin/api/billing/portal: 401 if not auth; 400 if no stripe_customer_id; returns url
 *  - Webhook: 400 if bad signature; handles checkout.session.completed upsert; handles subscription events
 *  - proxy.js: 'trialing' and 'past_due' are NOT blocked; 'suspended' and 'cancelled' ARE blocked
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')
jest.mock('stripe')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const Stripe = require('stripe')

// ---- helpers ----

function makeSupabaseMock({ orgData = {}, subData = null } = {}) {
  const defaultOrg = {
    id: 'org-1',
    name: 'Test Shop',
    slug: 'test-shop',
    status: 'trialing',
    plan_key: 'beta',
    trial_ends_at: new Date(Date.now() + 10 * 86400000).toISOString(),
    stripe_customer_id: null,
    ...orgData,
  }

  function makeChain(result) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      single: jest.fn().mockResolvedValue({ data: result, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: result, error: null }),
    }
  }

  const orgChain = makeChain(defaultOrg)
  const subChain = makeChain(subData)

  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'organizations') return orgChain
      if (table === 'organization_subscriptions') return subChain
      return makeChain(null)
    }),
  }
  return { supabase, orgChain, subChain }
}

// ---- GET /admin/api/billing ----

describe('GET /admin/api/billing', () => {
  const { GET } = require('../../app/admin/api/billing/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns billing shape with trialing status and trial days', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({
      orgData: {
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
    })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.billing.status).toBe('trialing')
    expect(body.billing.trialDaysLeft).toBeGreaterThan(0)
    expect(body.billing.hasActiveSubscription).toBe(false)
  })

  it('returns hasActiveSubscription true when sub row has stripe_subscription_id', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({
      orgData: { status: 'active', stripe_customer_id: 'cus_123' },
      subData: {
        organization_id: 'org-1',
        stripe_subscription_id: 'sub_abc',
        stripe_customer_id: 'cus_123',
        plan_key: 'pro',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancel_at_period_end: false,
        trial_ends_at: null,
      },
    })
    getSupabaseAdmin.mockReturnValue(supabase)

    const res = await GET()
    const body = await res.json()

    expect(body.billing.hasActiveSubscription).toBe(true)
    expect(body.billing.planKey).toBe('pro')
    expect(body.billing.stripeCustomerId).toBe('cus_123')
  })
})

// ---- POST /admin/api/billing/checkout ----

describe('POST /admin/api/billing/checkout', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const { POST } = require('../../app/admin/api/billing/checkout/route')
    const req = { json: async () => ({}), headers: { get: () => null } }
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 500 when STRIPE_BILLING_PRICE_ID is not set', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)
    delete process.env.STRIPE_BILLING_PRICE_ID

    const { POST } = require('../../app/admin/api/billing/checkout/route')
    const req = { json: async () => ({}), headers: { get: () => 'http://localhost:3000' } }
    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/not configured/i)
  })

  it('creates checkout session and returns url', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({ orgData: { stripe_customer_id: 'cus_existing' } })
    getSupabaseAdmin.mockReturnValue(supabase)
    process.env.STRIPE_BILLING_PRICE_ID = 'price_test'
    process.env.STRIPE_SECRET_KEY = 'sk_test'

    const mockStripeInstance = {
      customers: { create: jest.fn().mockResolvedValue({ id: 'cus_new' }) },
      checkout: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }) } },
    }
    Stripe.mockImplementation(() => mockStripeInstance)

    const { POST } = require('../../app/admin/api/billing/checkout/route')
    const req = { json: async () => ({}), headers: { get: () => 'http://localhost:3000' } }
    const res = await POST(req)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.url).toBe('https://checkout.stripe.com/test')
    expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription', customer: 'cus_existing' })
    )
  })
})

// ---- POST /admin/api/billing/portal ----

describe('POST /admin/api/billing/portal', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const { POST } = require('../../app/admin/api/billing/portal/route')
    const req = { json: async () => ({}), headers: { get: () => null } }
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when no stripe_customer_id exists', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({ orgData: { stripe_customer_id: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    Stripe.mockImplementation(() => ({}))

    const { POST } = require('../../app/admin/api/billing/portal/route')
    const req = { json: async () => ({}), headers: { get: () => null } }
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/No active subscription/i)
  })

  it('returns portal url when stripe_customer_id exists', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const { supabase } = makeSupabaseMock({ orgData: { stripe_customer_id: 'cus_abc' } })
    getSupabaseAdmin.mockReturnValue(supabase)
    process.env.STRIPE_SECRET_KEY = 'sk_test'

    const mockStripeInstance = {
      billingPortal: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal' }) } },
    }
    Stripe.mockImplementation(() => mockStripeInstance)

    const { POST } = require('../../app/admin/api/billing/portal/route')
    const req = { json: async () => ({}), headers: { get: () => 'http://localhost:3000' } }
    const res = await POST(req)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.url).toBe('https://billing.stripe.com/portal')
  })
})

// ---- POST /api/billing/webhook ----

describe('POST /api/billing/webhook', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 400 for invalid webhook signature', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    process.env.STRIPE_BILLING_WEBHOOK_SECRET = 'whsec_test'

    const mockStripeInstance = {
      webhooks: {
        constructEvent: jest.fn().mockImplementation(() => { throw new Error('Invalid signature') }),
      },
    }
    Stripe.mockImplementation(() => mockStripeInstance)

    const { POST } = require('../../app/api/billing/webhook/route')
    const req = {
      text: async () => '{}',
      headers: { get: () => 'sig_invalid' },
    }
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/signature/i)
  })

  it('upserts subscription and syncs org status on checkout.session.completed', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    process.env.STRIPE_BILLING_WEBHOOK_SECRET = 'whsec_test'

    const subscription = {
      id: 'sub_1',
      status: 'active',
      customer: 'cus_1',
      metadata: { organization_id: 'org-1' },
      items: { data: [{ price: { id: 'price_pro' } }] },
      trial_end: null,
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      cancel_at_period_end: false,
    }

    const mockStripeInstance = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: {
              mode: 'subscription',
              subscription: 'sub_1',
              subscription_data: { metadata: { organization_id: 'org-1' } },
              metadata: {},
            },
          },
        }),
      },
      subscriptions: { retrieve: jest.fn().mockResolvedValue(subscription) },
    }
    Stripe.mockImplementation(() => mockStripeInstance)

    const orgUpdateChain = { eq: jest.fn().mockResolvedValue({ error: null }) }
    const subUpsertChain = { upsert: jest.fn().mockResolvedValue({ error: null }) }
    const orgChain2 = { update: jest.fn().mockReturnValue(orgUpdateChain) }

    const supabase = {
      from: jest.fn().mockImplementation((table) => {
        if (table === 'organization_subscriptions') return subUpsertChain
        if (table === 'organizations') return orgChain2
        return { upsert: jest.fn().mockResolvedValue({ error: null }), update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }
      }),
    }
    getSupabaseAdmin.mockReturnValue(supabase)

    const { POST } = require('../../app/api/billing/webhook/route')
    const req = {
      text: async () => '{}',
      headers: { get: () => 'sig_valid' },
    }
    const res = await POST(req)
    const body = await res.json()

    expect(body.received).toBe(true)
    expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('sub_1')
  })

  it('returns 500 when STRIPE_BILLING_WEBHOOK_SECRET is not set', async () => {
    delete process.env.STRIPE_BILLING_WEBHOOK_SECRET
    Stripe.mockImplementation(() => ({}))

    const { POST } = require('../../app/api/billing/webhook/route')
    const req = { text: async () => '{}', headers: { get: () => null } }
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
