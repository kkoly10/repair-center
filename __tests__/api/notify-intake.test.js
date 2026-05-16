/**
 * POST /admin/api/orders/[orderId]/notify-intake
 *
 * Invariants:
 *  - 401 for unauthenticated requests
 *  - 404 when order not found / cross-org
 *  - 400 when submission_source is not walk_in
 *  - 400 when no customer email on file
 *  - 409 when intake confirmation already sent (dedupe_key = 'repair-status:null')
 *  - 200 ok:true on success (sendRepairStatusNotification called)
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/notifications')
jest.mock('../../lib/rateLimiter', () => ({ checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }) }))

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { sendRepairStatusNotification } = require('../../lib/notifications')

const ORG_ID = 'org-1'
const ORDER_ID = 'order-1'
const QUOTE_ID = 'qr-1'

function makeDb({
  order = { id: ORDER_ID, quote_request_id: QUOTE_ID, organization_id: ORG_ID },
  quote = { id: QUOTE_ID, submission_source: 'walk_in', guest_email: 'jane@example.com', customer_id: null },
  existingNotif = null,
} = {}) {
  return {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'repair_orders') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: order, error: null }),
        }
      }
      if (table === 'quote_requests') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: quote, error: null }),
        }
      }
      if (table === 'notifications') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: existingNotif, error: null }),
        }
      }
      if (table === 'customers') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  }
}

function makeContext(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) }
}

describe('POST /admin/api/orders/[orderId]/notify-intake', () => {
  const { POST } = require('../../app/admin/api/orders/[orderId]/notify-intake/route')
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await POST({}, makeContext())
    expect(res.status).toBe(401)
  })

  it('returns 404 when order is not found', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReturnValue(makeDb({ order: null }))
    const res = await POST({}, makeContext())
    expect(res.status).toBe(404)
  })

  it('returns 400 when submission_source is not walk_in', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReturnValue(makeDb({
      quote: { id: QUOTE_ID, submission_source: 'online', guest_email: 'jane@example.com', customer_id: null },
    }))
    const res = await POST({}, makeContext())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/walk.in/i)
  })

  it('returns 400 when no email address on file', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReturnValue(makeDb({
      quote: { id: QUOTE_ID, submission_source: 'walk_in', guest_email: null, customer_id: null },
    }))
    const res = await POST({}, makeContext())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/email/i)
  })

  it('returns 409 when intake notification was already sent (dedupe_key match)', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReturnValue(makeDb({ existingNotif: { id: 'notif-1' } }))
    const res = await POST({}, makeContext())
    expect(res.status).toBe(409)
  })

  it('calls sendRepairStatusNotification and returns ok:true on success', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReturnValue(makeDb())
    sendRepairStatusNotification.mockResolvedValue({ ok: true })
    const res = await POST({}, makeContext())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(sendRepairStatusNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        repairOrderId: ORDER_ID,
        status: 'received',
        historyId: null,
      })
    )
  })
})
