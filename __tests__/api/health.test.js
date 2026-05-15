/**
 * GET /api/health
 * - 200 when env + db pass; backup check skipped if no Mgmt API token
 * - 503 when required env vars are missing
 */

jest.mock('../../lib/supabase/admin')

const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET } = require('../../app/api/health/route')

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...ORIGINAL_ENV }
  // Set required vars so missingRequired is empty
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk'
  process.env.STRIPE_SECRET_KEY = 'sk'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec'
  process.env.STRIPE_BILLING_PRICE_ID = 'price_x'
  process.env.STRIPE_BILLING_WEBHOOK_SECRET = 'whsec_b'
  process.env.RESEND_API_KEY = 're_x'
  process.env.EMAIL_FROM = 'no-reply@example.com'
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  // Backup check disabled (no token / project id)
  delete process.env.SUPABASE_ACCESS_TOKEN
  delete process.env.SUPABASE_PROJECT_ID
})

afterAll(() => { process.env = ORIGINAL_ENV })

function makeDb({ error = null } = {}) {
  return {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error }),
      }),
    }),
  }
}

test('200 when env + db pass and backup check skipped', async () => {
  getSupabaseAdmin.mockReturnValue(makeDb({}))
  const res = await GET()
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.checks.env.ok).toBe(true)
  expect(body.checks.db.ok).toBe(true)
  expect(body.checks.backups.skipped).toBe(true)
})

test('503 when a required env var is missing', async () => {
  delete process.env.RESEND_API_KEY
  getSupabaseAdmin.mockReturnValue(makeDb({}))
  const res = await GET()
  expect(res.status).toBe(503)
  const body = await res.json()
  expect(body.checks.env.ok).toBe(false)
  expect(body.checks.env.missingRequired).toContain('RESEND_API_KEY')
})

test('503 when DB connectivity check fails', async () => {
  getSupabaseAdmin.mockReturnValue(makeDb({ error: { message: 'connect ECONNREFUSED' } }))
  const res = await GET()
  expect(res.status).toBe(503)
  const body = await res.json()
  expect(body.checks.db.ok).toBe(false)
})
