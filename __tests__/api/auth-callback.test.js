/**
 * Multi-tenant safety: GET /api/auth/callback
 *
 * Invariants:
 *  - Customer-row linking is scoped to the org derived from the `next` URL.
 *  - When `next` has no org context, no auto-linking occurs (would have been
 *    a tenant-boundary leak in the previous implementation).
 *  - Suspended/cancelled orgs do not get auto-links.
 */

jest.mock('@supabase/ssr')
jest.mock('next/headers')
jest.mock('../../lib/supabase/admin')

const { createServerClient } = require('@supabase/ssr')
const { cookies } = require('next/headers')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET } = require('../../app/api/auth/callback/route')

beforeEach(() => {
  jest.clearAllMocks()
  cookies.mockResolvedValue({ getAll: () => [], set: () => {} })
})

function makeAuthClient(user) {
  return {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue({
        data: user ? { user: { id: user.id, email: user.email } } : null,
        error: user ? null : { message: 'invalid code' },
      }),
    },
  }
}

function makeAdminClient({ org }) {
  const orgChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: org, error: null }),
  }
  const updateBuilder = {
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
  const customersChain = {
    update: jest.fn().mockReturnValue(updateBuilder),
  }
  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'organizations') return orgChain
      if (table === 'customers') return customersChain
      return {}
    }),
  }
  return { supabase, orgChain, customersChain, updateBuilder }
}

function makeRequest(qs) {
  return { url: `http://localhost/api/auth/callback?${qs}` }
}

test('redirects to / when no code is present', async () => {
  const res = await GET(makeRequest(''))
  expect(res.headers.get('location')).toBe('http://localhost/')
})

test('does NOT link customer rows when next has no org context', async () => {
  createServerClient.mockReturnValue(makeAuthClient({ id: 'user_1', email: 'john@example.com' }))
  const { supabase, customersChain } = makeAdminClient({ org: null })
  getSupabaseAdmin.mockReturnValue(supabase)

  await GET(makeRequest('code=abc&next=/'))

  expect(customersChain.update).not.toHaveBeenCalled()
})

test('links only the org extracted from next=/shop/<slug>/...', async () => {
  createServerClient.mockReturnValue(makeAuthClient({ id: 'user_2', email: 'jane@example.com' }))
  const { supabase, orgChain, customersChain, updateBuilder } = makeAdminClient({
    org: { id: 'org_A', status: 'active' },
  })
  getSupabaseAdmin.mockReturnValue(supabase)

  await GET(makeRequest('code=abc&next=' + encodeURIComponent('/shop/joes-repairs/account')))

  expect(orgChain.eq).toHaveBeenCalledWith('slug', 'joes-repairs')
  expect(customersChain.update).toHaveBeenCalledWith({ auth_user_id: 'user_2' })
  expect(updateBuilder.eq).toHaveBeenCalledWith('organization_id', 'org_A')
  expect(updateBuilder.is).toHaveBeenCalledWith('auth_user_id', null)
})

test('skips linking when the org is suspended', async () => {
  createServerClient.mockReturnValue(makeAuthClient({ id: 'user_3', email: 'x@example.com' }))
  const { supabase, customersChain } = makeAdminClient({
    org: { id: 'org_B', status: 'suspended' },
  })
  getSupabaseAdmin.mockReturnValue(supabase)

  await GET(makeRequest('code=abc&next=' + encodeURIComponent('/shop/bad-shop/account')))

  expect(customersChain.update).not.toHaveBeenCalled()
})

test('rejects an invalid slug pattern', async () => {
  createServerClient.mockReturnValue(makeAuthClient({ id: 'user_4', email: 'x@example.com' }))
  const { supabase, customersChain } = makeAdminClient({ org: null })
  getSupabaseAdmin.mockReturnValue(supabase)

  await GET(makeRequest('code=abc&next=' + encodeURIComponent('/shop/UPPERCASE/account')))

  expect(customersChain.update).not.toHaveBeenCalled()
})

test('blocks open redirect via absolute next URL', async () => {
  createServerClient.mockReturnValue(makeAuthClient({ id: 'user_5', email: 'x@example.com' }))
  getSupabaseAdmin.mockReturnValue(makeAdminClient({ org: null }).supabase)

  const res = await GET(makeRequest('code=abc&next=' + encodeURIComponent('https://evil.com')))
  expect(res.headers.get('location')).toBe('http://localhost')
})
