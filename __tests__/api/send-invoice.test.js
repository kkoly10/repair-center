/**
 * Multi-tenant safety: POST /admin/api/quotes/[quoteId]/send-invoice
 *
 * Invariants:
 *  - Requires authentication (401 if not)
 *  - Returns 404 if quote is not in session org
 *  - Returns 400 if no customer email found
 *  - Calls sendReceiptEmail with correct data on success
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/email')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { sendReceiptEmail } = require('../../lib/email')
const { POST } = require('../../app/admin/api/quotes/[quoteId]/send-invoice/route')

function makeContext(quoteId) {
  return { params: Promise.resolve({ quoteId }) }
}

function makeSupabaseMock(quoteResult, extras = {}) {
  const quoteChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(quoteResult),
  }

  function makeChain(result) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue(result || { data: null, error: null }),
    }
  }
  function makeListChain(result) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue(result || { data: [], error: null }),
    }
  }

  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'quote_requests') return quoteChain
      if (table === 'repair_orders') return makeChain(extras.orderResult)
      if (table === 'organizations') return makeChain(extras.orgResult || { data: { name: 'Test Shop', slug: 'test' }, error: null })
      if (table === 'customers') return makeChain(extras.customerResult)
      if (table === 'quote_estimates') return makeChain(extras.estimateResult)
      if (table === 'quote_estimate_items') return makeListChain(extras.itemsResult)
      if (table === 'payments') return makeListChain(extras.paymentsResult)
      return makeListChain({ data: [], error: null })
    }),
  }
  return supabase
}

describe('POST /admin/api/quotes/[quoteId]/send-invoice', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await POST(null, makeContext('RCQ-001'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when quote is not in session org', async () => {
    const supabase = makeSupabaseMock({ data: null, error: null })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST(null, makeContext('RCQ-001'))
    expect(res.status).toBe(404)
  })

  it('returns 400 when no customer email is available', async () => {
    const supabase = makeSupabaseMock({
      data: {
        id: 'qr-1',
        quote_id: 'RCQ-001',
        organization_id: 'org-a',
        guest_email: null,
        customer_id: null,
        brand_name: 'Apple',
        model_name: 'iPhone',
        repair_type_key: 'screen',
        issue_description: null,
        first_name: null,
        last_name: null,
        guest_phone: null,
      },
      error: null,
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST(null, makeContext('RCQ-001'))
    expect(res.status).toBe(400)
  })

  it('calls sendReceiptEmail and returns ok:true on success', async () => {
    sendReceiptEmail.mockResolvedValue()

    const supabase = makeSupabaseMock(
      {
        data: {
          id: 'qr-1',
          quote_id: 'RCQ-001',
          organization_id: 'org-a',
          guest_email: 'customer@example.com',
          customer_id: null,
          brand_name: 'Apple',
          model_name: 'iPhone 14',
          repair_type_key: 'screen_repair',
          issue_description: 'Cracked screen',
          first_name: 'Jane',
          last_name: 'Doe',
          guest_phone: null,
        },
        error: null,
      },
      {
        orderResult: { data: null, error: null },
      }
    )
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await POST(null, makeContext('RCQ-001'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(sendReceiptEmail).toHaveBeenCalledTimes(1)
    expect(sendReceiptEmail.mock.calls[0][0].to).toBe('customer@example.com')
  })
})
