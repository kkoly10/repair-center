/**
 * GET /api/cron/follow-up
 *
 * Invariants:
 *  - 401 if CRON_SECRET not provided or wrong
 *  - 500 if CRON_SECRET not configured
 *  - Queries repair_orders for shipped/delivered within review window
 *  - Queries repair_orders for warranty expiry window
 *  - Deduplication handled by sendReviewRequestEmail (via notifications table) — skipped count increments
 *  - Returns {ok, reviewSent, warrantySent, skipped, errors}
 */

jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/followUpEmails')

const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { sendReviewRequestEmail, sendWarrantyReminderEmail } = require('../../lib/followUpEmails')
const { GET } = require('../../app/api/cron/follow-up/route')

const SECRET = 'test-cron-secret'

function makeRequest(authHeader) {
  return {
    headers: { get: jest.fn((h) => (h === 'authorization' ? authHeader : null)) },
  }
}

function makeSupabaseMock({ reviewOrders = [], warrantyOrders = [] } = {}) {
  let callCount = 0
  function makeChain(result) {
    const chain = {
      then: (resolve) => resolve(result),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
    }
    return chain
  }

  return {
    from: jest.fn().mockImplementation(() => {
      const result = callCount++ === 0
        ? { data: reviewOrders, error: null }
        : { data: warrantyOrders, error: null }
      return makeChain(result)
    }),
  }
}

describe('GET /api/cron/follow-up', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV, CRON_SECRET: SECRET }
  })

  afterEach(() => {
    process.env = OLD_ENV
    jest.clearAllMocks()
  })

  it('returns 500 if CRON_SECRET not configured', async () => {
    delete process.env.CRON_SECRET
    const res = await GET(makeRequest(null))
    expect(res.status).toBe(500)
  })

  it('returns 401 without auth header', async () => {
    const res = await GET(makeRequest(null))
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong secret', async () => {
    const res = await GET(makeRequest('Bearer wrong'))
    expect(res.status).toBe(401)
  })

  it('returns ok with zero counts when no candidates', async () => {
    const supabase = makeSupabaseMock()
    getSupabaseAdmin.mockReturnValue(supabase)
    sendReviewRequestEmail.mockResolvedValue({ ok: true, skipped: false })
    sendWarrantyReminderEmail.mockResolvedValue({ ok: true, skipped: false })

    const res = await GET(makeRequest(`Bearer ${SECRET}`))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.reviewSent).toBe(0)
    expect(body.warrantySent).toBe(0)
    expect(body.errors).toHaveLength(0)
  })

  it('increments reviewSent for each sent review email', async () => {
    const reviewOrders = [
      { id: 'ro-1', quote_request_id: 'qr-1', organization_id: 'org-1' },
      { id: 'ro-2', quote_request_id: 'qr-2', organization_id: 'org-1' },
    ]
    const supabase = makeSupabaseMock({ reviewOrders })
    getSupabaseAdmin.mockReturnValue(supabase)
    sendReviewRequestEmail.mockResolvedValue({ ok: true, skipped: false })
    sendWarrantyReminderEmail.mockResolvedValue({ ok: true, skipped: false })

    const res = await GET(makeRequest(`Bearer ${SECRET}`))
    const body = await res.json()
    expect(body.reviewSent).toBe(2)
    expect(sendReviewRequestEmail).toHaveBeenCalledTimes(2)
  })

  it('increments skipped when review email is duplicate', async () => {
    const reviewOrders = [{ id: 'ro-1', quote_request_id: 'qr-1', organization_id: 'org-1' }]
    const supabase = makeSupabaseMock({ reviewOrders })
    getSupabaseAdmin.mockReturnValue(supabase)
    sendReviewRequestEmail.mockResolvedValue({ ok: true, skipped: true, reason: 'duplicate' })
    sendWarrantyReminderEmail.mockResolvedValue({ ok: true, skipped: false })

    const res = await GET(makeRequest(`Bearer ${SECRET}`))
    const body = await res.json()
    expect(body.skipped).toBe(1)
    expect(body.reviewSent).toBe(0)
  })
})
