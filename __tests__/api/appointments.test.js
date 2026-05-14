/**
 * Sprint 23 — Appointment scheduling
 *
 * Tests:
 *  POST /api/appointments       — public booking endpoint
 *  GET  /admin/api/appointments — admin list, org-scoped, status filter
 *  PATCH /admin/api/appointments/[appointmentId] — status transitions + auto-timestamps
 */

jest.mock('../../lib/supabase/admin', () => ({ getSupabaseAdmin: jest.fn() }))
jest.mock('../../lib/admin/getSessionOrgId', () => ({ getSessionOrgId: jest.fn() }))
jest.mock('../../lib/email', () => ({ sendAppointmentConfirmationEmail: jest.fn().mockResolvedValue(undefined) }))
jest.mock('../../lib/rateLimiter', () => ({ checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9 }) }))

const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { sendAppointmentConfirmationEmail } = require('../../lib/email')

const ORG_ID = 'org-aaa'
const ORG_SLUG = 'acme-repairs'
const APPT_ID = 'appt-bbb'

// Future datetime for tests
const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

function makeRequest(body = {}, url = 'http://localhost/api/appointments') {
  return { json: async () => body, url, headers: { get: () => null } }
}

function makeAdminRequest(body = {}, url = 'http://localhost/admin/api/appointments') {
  return { json: async () => body, url, headers: { get: () => null } }
}

function makeContext(params = {}) {
  return { params: Promise.resolve(params) }
}

// ---------------------------------------------------------------------------
// POST /api/appointments (public)
// ---------------------------------------------------------------------------
describe('POST /api/appointments', () => {
  const { POST } = require('../../app/api/appointments/route')

  beforeEach(() => {
    getSupabaseAdmin.mockReset()
    sendAppointmentConfirmationEmail.mockClear()
  })

  it('returns 400 when orgSlug is missing', async () => {
    getSupabaseAdmin.mockReturnValue({ from: jest.fn() })
    const res = await POST(makeRequest({ firstName: 'Jane', email: 'j@e.com', preferredAt: FUTURE }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/orgSlug/)
  })

  it('returns 400 when email is missing', async () => {
    getSupabaseAdmin.mockReturnValue({ from: jest.fn() })
    const res = await POST(makeRequest({ orgSlug: ORG_SLUG, firstName: 'Jane', preferredAt: FUTURE }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  it('returns 400 when firstName is whitespace-only', async () => {
    getSupabaseAdmin.mockReturnValue({ from: jest.fn() })
    const res = await POST(makeRequest({ orgSlug: ORG_SLUG, firstName: '   ', email: 'j@e.com', preferredAt: FUTURE }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/first name/i)
  })

  it('returns 400 when preferredAt is in the past', async () => {
    const past = new Date(Date.now() - 1000).toISOString()
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybySingle: jest.fn(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: ORG_ID, name: 'Acme', status: 'active' }, error: null }),
      })),
    })
    const res = await POST(makeRequest({ orgSlug: ORG_SLUG, firstName: 'Jane', email: 'j@e.com', preferredAt: past }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/future/i)
  })

  it('returns 404 when org slug not found', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })
    const res = await POST(makeRequest({ orgSlug: 'unknown', firstName: 'Jane', email: 'j@e.com', preferredAt: FUTURE }))
    expect(res.status).toBe(404)
  })

  it('creates appointment and returns 201', async () => {
    const newAppt = { id: APPT_ID, preferred_at: FUTURE, status: 'pending' }
    let callCount = 0
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => {
        callCount++
        if (callCount === 1) {
          // org lookup
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: ORG_ID, name: 'Acme', status: 'active' }, error: null }),
          }
        }
        if (callCount === 2) {
          // customers auto-link lookup
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        // appointments insert
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: newAppt, error: null }),
        }
      }),
    })
    const res = await POST(makeRequest({ orgSlug: ORG_SLUG, firstName: 'Jane', email: 'j@e.com', preferredAt: FUTURE }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.appointment.id).toBe(APPT_ID)
  })

  it('inserts with correct organization_id', async () => {
    const insertMock = jest.fn().mockReturnThis()
    let callCount = 0
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: ORG_ID, name: 'Acme', status: 'active' }, error: null }),
          }
        }
        if (callCount === 2) {
          // customers auto-link lookup
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {
          insert: insertMock,
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: APPT_ID, preferred_at: FUTURE, status: 'pending' }, error: null }),
        }
      }),
    })
    await POST(makeRequest({ orgSlug: ORG_SLUG, firstName: 'Jane', email: 'j@e.com', preferredAt: FUTURE }))
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ organization_id: ORG_ID, email: 'j@e.com' }))
  })
})

// ---------------------------------------------------------------------------
// GET /admin/api/appointments
// ---------------------------------------------------------------------------
describe('GET /admin/api/appointments', () => {
  const { GET } = require('../../app/admin/api/appointments/route')

  beforeEach(() => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET(makeAdminRequest())
    expect(res.status).toBe(401)
  })

  it('returns org-scoped appointments', async () => {
    const appts = [{ id: APPT_ID, first_name: 'Jane', status: 'pending', preferred_at: FUTURE }]
    const eqMock = jest.fn().mockReturnThis()
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: eqMock,
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (resolve) => resolve({ data: appts, error: null }),
    }
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) })
    const res = await GET(makeAdminRequest({}, 'http://localhost/admin/api/appointments'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.appointments).toHaveLength(1)
    expect(eqMock).toHaveBeenCalledWith('organization_id', ORG_ID)
  })

  it('applies status filter from query param', async () => {
    const eqMock = jest.fn().mockReturnThis()
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: eqMock,
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (resolve) => resolve({ data: [], error: null }),
    }
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) })
    await GET(makeAdminRequest({}, 'http://localhost/admin/api/appointments?status=confirmed'))
    expect(eqMock).toHaveBeenCalledWith('status', 'confirmed')
  })
})

// ---------------------------------------------------------------------------
// PATCH /admin/api/appointments/[appointmentId]
// ---------------------------------------------------------------------------
describe('PATCH /admin/api/appointments/[appointmentId]', () => {
  const { PATCH } = require('../../app/admin/api/appointments/[appointmentId]/route')

  beforeEach(() => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when not authenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await PATCH(makeAdminRequest({ status: 'confirmed' }), makeContext({ appointmentId: APPT_ID }))
    expect(res.status).toBe(401)
  })

  it('returns 404 for cross-org appointment', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })
    const res = await PATCH(makeAdminRequest({ status: 'confirmed' }), makeContext({ appointmentId: APPT_ID }))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: APPT_ID, status: 'pending' }, error: null }),
      })),
    })
    const res = await PATCH(makeAdminRequest({ status: 'bogus' }), makeContext({ appointmentId: APPT_ID }))
    expect(res.status).toBe(400)
  })

  it('confirms appointment and sets confirmed_at', async () => {
    const updated = { id: APPT_ID, status: 'confirmed', confirmed_at: new Date().toISOString() }
    const updateMock = jest.fn().mockReturnThis()
    let callCount = 0
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: APPT_ID, status: 'pending' }, error: null }),
          }
        }
        return {
          update: updateMock,
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: updated, error: null }),
        }
      }),
    })
    const res = await PATCH(makeAdminRequest({ status: 'confirmed' }), makeContext({ appointmentId: APPT_ID }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.appointment.status).toBe('confirmed')
    // confirmed_at should be set in the update
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'confirmed', confirmed_at: expect.any(String) }))
  })

  it('enforces org_id on update', async () => {
    const eqMock = jest.fn().mockReturnThis()
    let callCount = 0
    getSupabaseAdmin.mockReturnValue({
      from: jest.fn(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: APPT_ID, status: 'pending' }, error: null }),
          }
        }
        return {
          update: jest.fn().mockReturnThis(),
          eq: eqMock,
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: APPT_ID, status: 'confirmed' }, error: null }),
        }
      }),
    })
    await PATCH(makeAdminRequest({ status: 'confirmed' }), makeContext({ appointmentId: APPT_ID }))
    expect(eqMock).toHaveBeenCalledWith('organization_id', ORG_ID)
  })
})
