jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/observability')
jest.mock('stripe')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { reportError } = require('../../lib/observability')
const Stripe = require('stripe')

// ── Supabase mock factory ──────────────────────────────────────────────────────

function makeDb(paymentSettings = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: paymentSettings, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  }
  return { from: jest.fn().mockReturnValue(chain), _chain: chain }
}

// ── /admin/api/billing/connect/onboard ────────────────────────────────────────

describe('POST /admin/api/billing/connect/onboard', () => {
  const { POST } = require('../../app/admin/api/billing/connect/onboard/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const req = { headers: { get: () => null } }
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates a new account when none exists', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb({ stripe_connect_account_id: null })
    getSupabaseAdmin.mockReturnValue(db)
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'

    const mockStripe = {
      accounts: { create: jest.fn().mockResolvedValue({ id: 'acct_new' }) },
      accountLinks: { create: jest.fn().mockResolvedValue({ url: 'https://stripe.com/onboard' }) },
    }
    Stripe.mockImplementation(() => mockStripe)

    const req = { headers: { get: () => 'http://localhost:3000' } }
    const res = await POST(req)
    const json = await res.json()

    expect(mockStripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'express', metadata: { organization_id: 'org-1' } })
    )
    expect(json.url).toBe('https://stripe.com/onboard')
  })

  it('reuses existing account id without calling accounts.create', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb({ stripe_connect_account_id: 'acct_existing' })
    getSupabaseAdmin.mockReturnValue(db)
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'

    const mockStripe = {
      accounts: { create: jest.fn() },
      accountLinks: { create: jest.fn().mockResolvedValue({ url: 'https://stripe.com/resume' }) },
    }
    Stripe.mockImplementation(() => mockStripe)

    const req = { headers: { get: () => 'http://localhost:3000' } }
    const res = await POST(req)
    const json = await res.json()

    expect(mockStripe.accounts.create).not.toHaveBeenCalled()
    expect(json.url).toBe('https://stripe.com/resume')
  })

  it('returns { url } shape', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb({ stripe_connect_account_id: 'acct_x' })
    getSupabaseAdmin.mockReturnValue(db)
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'

    Stripe.mockImplementation(() => ({
      accounts: {},
      accountLinks: { create: jest.fn().mockResolvedValue({ url: 'https://stripe.com/link' }) },
    }))

    const req = { headers: { get: () => 'http://localhost:3000' } }
    const res = await POST(req)
    const json = await res.json()

    expect(json).toEqual(expect.objectContaining({ url: expect.any(String) }))
  })
})

// ── /admin/api/billing/connect/status ────────────────────────────────────────

describe('GET /admin/api/billing/connect/status', () => {
  const { GET } = require('../../app/admin/api/billing/connect/status/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns { connected: false } when no account exists', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb({ stripe_connect_account_id: null })
    getSupabaseAdmin.mockReturnValue(db)

    const res = await GET()
    const json = await res.json()
    expect(json).toEqual({ connected: false })
  })

  it('retrieves account and upserts capabilities', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb({ stripe_connect_account_id: 'acct_abc' })
    getSupabaseAdmin.mockReturnValue(db)
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'

    const mockStripe = {
      accounts: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'acct_abc',
          charges_enabled: true,
          payouts_enabled: true,
        }),
      },
    }
    Stripe.mockImplementation(() => mockStripe)

    await GET()

    expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith('acct_abc')
    expect(db._chain.upsert).toHaveBeenCalled()
  })

  it('returns correct response shape when connected', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const db = makeDb({ stripe_connect_account_id: 'acct_abc' })
    getSupabaseAdmin.mockReturnValue(db)
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'

    Stripe.mockImplementation(() => ({
      accounts: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'acct_abc',
          charges_enabled: true,
          payouts_enabled: false,
        }),
      },
    }))

    const res = await GET()
    const json = await res.json()

    expect(json).toEqual({
      connected: true,
      chargesEnabled: true,
      payoutsEnabled: false,
      accountId: 'acct_abc',
    })
  })
})

// ── /api/billing/connect/webhook ─────────────────────────────────────────────

describe('POST /api/billing/connect/webhook', () => {
  const { POST } = require('../../app/api/billing/connect/webhook/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 500 when STRIPE_CONNECT_WEBHOOK_SECRET is not set', async () => {
    delete process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    Stripe.mockImplementation(() => ({}))

    const req = { text: jest.fn().mockResolvedValue(''), headers: { get: jest.fn().mockReturnValue('sig') } }
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_test'
    Stripe.mockImplementation(() => ({}))

    const req = { text: jest.fn().mockResolvedValue('payload'), headers: { get: jest.fn().mockReturnValue(null) } }
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 on bad signature', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_test'

    Stripe.mockImplementation(() => ({
      webhooks: { constructEvent: jest.fn().mockImplementation(() => { throw new Error('Bad sig') }) },
    }))

    const req = {
      text: jest.fn().mockResolvedValue('payload'),
      headers: { get: jest.fn().mockReturnValue('bad-sig') },
    }
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('upserts capabilities on account.updated', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_test'

    const db = makeDb()
    getSupabaseAdmin.mockReturnValue(db)

    const event = {
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_xyz',
          charges_enabled: true,
          payouts_enabled: true,
          metadata: { organization_id: 'org-1' },
        },
      },
    }
    Stripe.mockImplementation(() => ({
      webhooks: { constructEvent: jest.fn().mockReturnValue(event) },
    }))

    const req = {
      text: jest.fn().mockResolvedValue('payload'),
      headers: { get: jest.fn().mockReturnValue('sig') },
    }
    const res = await POST(req)
    const json = await res.json()

    expect(json).toEqual({ received: true })
    expect(db._chain.upsert).toHaveBeenCalled()
  })

  it('handles account.application.deauthorized: clears connect fields and downgrades stripe_connect mode', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_test'

    // Two distinct chains: one for the SELECT lookup, one for the UPDATE
    const lookupChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { organization_id: 'org-9', payment_mode: 'stripe_connect' },
        error: null,
      }),
    }
    const updateBuilder = {
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
    const updateChain = {
      update: jest.fn().mockReturnValue(updateBuilder),
    }
    // First .from() call → lookup; second .from() call → update
    let fromCallCount = 0
    const db = {
      from: jest.fn().mockImplementation(() => {
        fromCallCount += 1
        return fromCallCount === 1 ? lookupChain : updateChain
      }),
    }
    getSupabaseAdmin.mockReturnValue(db)

    const event = {
      type: 'account.application.deauthorized',
      account: 'acct_revoked',
    }
    Stripe.mockImplementation(() => ({
      webhooks: { constructEvent: jest.fn().mockReturnValue(event) },
    }))

    const req = {
      text: jest.fn().mockResolvedValue('payload'),
      headers: { get: jest.fn().mockReturnValue('sig') },
    }
    const res = await POST(req)
    const json = await res.json()

    expect(json).toEqual({ received: true })

    // Lookup queried by stripe_connect_account_id
    expect(lookupChain.eq).toHaveBeenCalledWith('stripe_connect_account_id', 'acct_revoked')

    // Update cleared the four connect columns AND downgraded payment_mode
    expect(updateChain.update).toHaveBeenCalledWith({
      stripe_connect_account_id: null,
      stripe_connect_charges_enabled: false,
      stripe_connect_payouts_enabled: false,
      stripe_connect_onboarding_complete: false,
      payment_mode: 'manual',
    })
    expect(updateBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-9')

    // Logged to reportError as an operational signal
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Stripe Connect deauthorized for org org-9') }),
      expect.objectContaining({
        area: 'billing-connect-webhook',
        eventKey: 'account.application.deauthorized',
        accountId: 'acct_revoked',
        organizationId: 'org-9',
      })
    )
  })

  it('account.application.deauthorized: does not downgrade payment_mode when org was not on stripe_connect', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_test'

    const lookupChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { organization_id: 'org-9', payment_mode: 'manual' },
        error: null,
      }),
    }
    const updateBuilder = { eq: jest.fn().mockResolvedValue({ error: null }) }
    const updateChain = { update: jest.fn().mockReturnValue(updateBuilder) }
    let fromCallCount = 0
    const db = {
      from: jest.fn().mockImplementation(() => {
        fromCallCount += 1
        return fromCallCount === 1 ? lookupChain : updateChain
      }),
    }
    getSupabaseAdmin.mockReturnValue(db)

    const event = { type: 'account.application.deauthorized', account: 'acct_revoked' }
    Stripe.mockImplementation(() => ({
      webhooks: { constructEvent: jest.fn().mockReturnValue(event) },
    }))

    const req = {
      text: jest.fn().mockResolvedValue('payload'),
      headers: { get: jest.fn().mockReturnValue('sig') },
    }
    await POST(req)

    const updateArg = updateChain.update.mock.calls[0][0]
    expect(updateArg).not.toHaveProperty('payment_mode')
    expect(updateArg.stripe_connect_account_id).toBeNull()
  })

  it('account.application.deauthorized: skips update + logs when no org maps to the account', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_test'

    const lookupChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }
    const updateChain = { update: jest.fn() }
    let fromCallCount = 0
    const db = {
      from: jest.fn().mockImplementation(() => {
        fromCallCount += 1
        return fromCallCount === 1 ? lookupChain : updateChain
      }),
    }
    getSupabaseAdmin.mockReturnValue(db)

    const event = { type: 'account.application.deauthorized', account: 'acct_orphan' }
    Stripe.mockImplementation(() => ({
      webhooks: { constructEvent: jest.fn().mockReturnValue(event) },
    }))

    const req = {
      text: jest.fn().mockResolvedValue('payload'),
      headers: { get: jest.fn().mockReturnValue('sig') },
    }
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(updateChain.update).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
  })
})

// ── getConnectParams helper ───────────────────────────────────────────────────

describe('getConnectParams', () => {
  const { getConnectParams } = require('../../lib/payments/getConnectParams')
  afterEach(() => jest.clearAllMocks())

  beforeEach(() => {
    process.env.STRIPE_CONNECT_PLATFORM_FEE_PERCENT = '0.0075'
  })

  it('returns destination + feePercent when stripe_connect mode is active', async () => {
    const db = makeDb({
      payment_mode: 'stripe_connect',
      stripe_connect_account_id: 'acct_abc',
      stripe_connect_charges_enabled: true,
    })
    const result = await getConnectParams(db, 'org-1')
    expect(result).toEqual({ destination: 'acct_abc', feePercent: 0.0075 })
  })

  it('returns null when payment_mode is not stripe_connect', async () => {
    const db = makeDb({
      payment_mode: 'manual',
      stripe_connect_account_id: 'acct_abc',
      stripe_connect_charges_enabled: true,
    })
    const result = await getConnectParams(db, 'org-1')
    expect(result).toBeNull()
  })

  it('returns null when charges_enabled is false', async () => {
    const db = makeDb({
      payment_mode: 'stripe_connect',
      stripe_connect_account_id: 'acct_abc',
      stripe_connect_charges_enabled: false,
    })
    const result = await getConnectParams(db, 'org-1')
    expect(result).toBeNull()
  })
})
