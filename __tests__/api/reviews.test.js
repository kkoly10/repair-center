/**
 * POST /api/review/[quoteId]
 * GET  /admin/api/reviews
 *
 * Invariants:
 *  POST:
 *   - 400 on missing/invalid rating
 *   - 404 if quote not found
 *   - 409 on duplicate (23505 unique violation)
 *   - 200 + {ok:true} on success
 *  GET (admin):
 *   - 401 if not authenticated
 *   - org-scoped query
 *   - summary stats (total, avgRating, distribution)
 *   - maps quote_requests join to device/customerName fields
 */

jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/admin/getSessionOrgId')

const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { POST } = require('../../app/api/review/[quoteId]/route')
const { GET } = require('../../app/admin/api/reviews/route')

// ──── POST /api/review/[quoteId] ────

function makePostSupabase({ quoteData = null, quoteError = null, repairOrderData = null, insertError = null } = {}) {
  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'quote_requests') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: quoteData, error: quoteError }),
        }
      }
      if (table === 'repair_orders') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: repairOrderData, error: null }),
        }
      }
      if (table === 'repair_reviews') {
        return {
          insert: jest.fn().mockResolvedValue({ error: insertError }),
        }
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }
    }),
  }
  return supabase
}

function makePostRequest(body) {
  return {
    json: jest.fn().mockResolvedValue(body),
  }
}

const CONTEXT = { params: Promise.resolve({ quoteId: 'RCQ-001' }) }

describe('POST /api/review/[quoteId]', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 400 for missing rating', async () => {
    const supabase = makePostSupabase({ quoteData: { id: 'q-1', organization_id: 'org-1' } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makePostRequest({ comment: 'great' }), CONTEXT)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/rating/i)
  })

  it('returns 400 for out-of-range rating', async () => {
    const supabase = makePostSupabase({ quoteData: { id: 'q-1', organization_id: 'org-1' } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makePostRequest({ rating: 6 }), CONTEXT)
    expect(res.status).toBe(400)
  })

  it('returns 404 if quote not found', async () => {
    const supabase = makePostSupabase({ quoteData: null })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makePostRequest({ rating: 5 }), CONTEXT)
    expect(res.status).toBe(404)
  })

  it('returns 409 for duplicate review', async () => {
    const supabase = makePostSupabase({
      quoteData: { id: 'q-1', organization_id: 'org-1' },
      insertError: { code: '23505', message: 'unique violation' },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makePostRequest({ rating: 4 }), CONTEXT)
    expect(res.status).toBe(409)
  })

  it('returns 200 on successful review submission', async () => {
    const supabase = makePostSupabase({
      quoteData: { id: 'q-1', organization_id: 'org-1' },
      repairOrderData: { id: 'ro-1' },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makePostRequest({ rating: 5, comment: 'Excellent!' }), CONTEXT)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

// ──── GET /admin/api/reviews ────

function makeAdminReviewsSupabase({ reviews = [] } = {}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: reviews, error: null }),
  }
  return { from: jest.fn().mockReturnValue(chain), chain }
}

describe('GET /admin/api/reviews', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('queries with org filter', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = makeAdminReviewsSupabase()
    getSupabaseAdmin.mockReturnValue(supabase)
    await GET()
    expect(supabase.chain.eq).toHaveBeenCalledWith('organization_id', 'org-1')
  })

  it('returns correct summary stats', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = makeAdminReviewsSupabase({
      reviews: [
        { id: 'r1', rating: 5, comment: null, source: 'email_link', created_at: '2026-05-01T00:00:00Z', quote_requests: { quote_id: 'RCQ-1', first_name: 'Alice', last_name: null, brand_name: 'Apple', model_name: 'iPhone 14', repair_type_key: 'screen_repair' } },
        { id: 'r2', rating: 3, comment: 'ok', source: 'web', created_at: '2026-05-02T00:00:00Z', quote_requests: { quote_id: 'RCQ-2', first_name: 'Bob', last_name: 'Smith', brand_name: null, model_name: null, repair_type_key: null } },
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await GET()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.summary.total).toBe(2)
    expect(body.summary.avgRating).toBe(4.0)
    expect(body.summary.distribution[5]).toBe(1)
    expect(body.summary.distribution[3]).toBe(1)
  })

  it('maps review rows to correct shape', async () => {
    getSessionOrgId.mockResolvedValue('org-1')
    const supabase = makeAdminReviewsSupabase({
      reviews: [
        { id: 'r1', rating: 4, comment: 'Great job', source: 'email_link', created_at: '2026-05-01T00:00:00Z', quote_requests: { quote_id: 'RCQ-1', first_name: 'Jane', last_name: 'Doe', brand_name: 'Samsung', model_name: 'Galaxy S23', repair_type_key: 'battery_replacement' } },
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await GET()
    const body = await res.json()
    const r = body.reviews[0]
    expect(r.rating).toBe(4)
    expect(r.comment).toBe('Great job')
    expect(r.customerName).toBe('Jane Doe')
    expect(r.device).toBe('Samsung Galaxy S23')
    expect(r.quoteId).toBe('RCQ-1')
  })
})
