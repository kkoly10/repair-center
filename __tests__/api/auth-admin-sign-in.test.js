/**
 * Rate-limited admin sign-in: POST /api/auth/admin-sign-in
 *
 * Invariants:
 *  - Rate limit (5 / 15min per IP) → 429
 *  - Auth failure → 401 with generic "Invalid email or password" (no leak)
 *  - Success → 200 { ok: true } (Set-Cookie handled by createServerClient)
 */

jest.mock('@supabase/ssr')
jest.mock('next/headers')
jest.mock('../../lib/rateLimiter')

const { createServerClient } = require('@supabase/ssr')
const { cookies } = require('next/headers')
const { checkRateLimit } = require('../../lib/rateLimiter')

// Provide URL/key env so the route doesn't 500 in test
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'

const { POST } = require('../../app/api/auth/admin-sign-in/route')

beforeEach(() => {
  jest.clearAllMocks()
  cookies.mockResolvedValue({ getAll: () => [], set: () => {} })
})

function makeRequest(body, headers = {}) {
  const headerMap = {
    'x-forwarded-for': '1.2.3.4',
    'content-type': 'application/json',
    ...headers,
  }
  return {
    headers: {
      get: (name) => headerMap[name.toLowerCase()] ?? null,
    },
    json: jest.fn().mockResolvedValue(body),
  }
}

test('returns 429 when rate limit exceeded', async () => {
  checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 })

  const res = await POST(makeRequest({ email: 'a@b.com', password: 'pw' }))
  expect(res.status).toBe(429)

  const json = await res.json()
  expect(json.error).toMatch(/too many/i)

  // Must NOT call Supabase when rate-limited
  expect(createServerClient).not.toHaveBeenCalled()
})

test('returns 401 with generic message on invalid credentials (no leak)', async () => {
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })

  createServerClient.mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      }),
    },
  })

  const res = await POST(makeRequest({ email: 'unknown@example.com', password: 'wrong' }))
  expect(res.status).toBe(401)

  const json = await res.json()
  // Generic message — must NOT echo Supabase's specific error
  expect(json.error).toBe('Invalid email or password.')
  expect(json.error).not.toMatch(/credentials/i)
})

test('returns 401 with generic message when user does not exist (no leak)', async () => {
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })

  // Some Supabase auth errors return {data:null, error:null} edge cases; we
  // still must not leak. Test the broader contract: any non-user result → 401.
  createServerClient.mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  })

  const res = await POST(makeRequest({ email: 'a@b.com', password: 'pw' }))
  expect(res.status).toBe(401)
  const json = await res.json()
  expect(json.error).toBe('Invalid email or password.')
})

test('returns 401 when email or password is missing (no Supabase call)', async () => {
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })

  const res = await POST(makeRequest({ email: '', password: '' }))
  expect(res.status).toBe(401)
  expect(createServerClient).not.toHaveBeenCalled()
})

test('returns 200 { ok: true } on successful sign-in', async () => {
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })

  const signInMock = jest.fn().mockResolvedValue({
    data: { user: { id: 'user_123', email: 'admin@example.com' } },
    error: null,
  })
  createServerClient.mockReturnValue({
    auth: { signInWithPassword: signInMock },
  })

  const res = await POST(makeRequest({ email: 'admin@example.com', password: 'good-password' }))
  expect(res.status).toBe(200)

  const json = await res.json()
  expect(json).toEqual({ ok: true })

  // Confirms cookieStore was wired into createServerClient — Set-Cookie will
  // be emitted by Supabase's internal cookie.setAll on a successful session.
  expect(signInMock).toHaveBeenCalledWith({
    email: 'admin@example.com',
    password: 'good-password',
  })
})

test('rejects cross-origin POSTs with 403', async () => {
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })

  const res = await POST(
    makeRequest(
      { email: 'a@b.com', password: 'pw' },
      { origin: 'https://evil.com', host: 'localhost:3000' }
    )
  )
  expect(res.status).toBe(403)
  expect(createServerClient).not.toHaveBeenCalled()
})

test('normalizes email (lowercase + trim) before sign-in', async () => {
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })

  const signInMock = jest.fn().mockResolvedValue({
    data: { user: { id: 'u1' } },
    error: null,
  })
  createServerClient.mockReturnValue({
    auth: { signInWithPassword: signInMock },
  })

  await POST(makeRequest({ email: '  Admin@Example.com  ', password: 'pw' }))

  expect(signInMock).toHaveBeenCalledWith({
    email: 'admin@example.com',
    password: 'pw',
  })
})
