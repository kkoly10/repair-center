/**
 * Multi-tenant safety: GET /admin/api/staff/performance
 *
 * Invariants:
 *  - Requires authentication (401 if not)
 *  - Only returns members and orders from the session org (organization_id filter)
 *  - Metrics are computed correctly from order data
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')

const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { GET } = require('../../app/admin/api/staff/performance/route')

// Build per-table chain mocks so Promise.all([membersQuery, ordersQuery]) works correctly.
// Each table gets its own chain that resolves with the provided result.
function makeSupabaseMock({ membersResult, ordersResult }) {
  function makeTableChain(result) {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue(result),
    }
    return chain
  }

  const memberChain = makeTableChain(membersResult)
  const orderChain = makeTableChain(ordersResult)

  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'organization_members') return memberChain
      if (table === 'repair_orders') return orderChain
      return makeTableChain({ data: [], error: null })
    }),
  }

  return { supabase, memberChain, orderChain }
}

describe('GET /admin/api/staff/performance', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('filters members by organization_id', async () => {
    const { supabase, memberChain } = makeSupabaseMock({
      membersResult: { data: [], error: null },
      ordersResult: { data: [], error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await GET()

    expect(memberChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
  })

  it('filters orders by organization_id', async () => {
    const { supabase, orderChain } = makeSupabaseMock({
      membersResult: { data: [], error: null },
      ordersResult: { data: [], error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await GET()

    expect(orderChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
  })

  it('returns ok:true with stats array on success', async () => {
    const { supabase } = makeSupabaseMock({
      membersResult: {
        data: [
          { user_id: 'u-1', role: 'tech', profiles: { full_name: 'Alice Tech' } },
        ],
        error: null,
      },
      ordersResult: { data: [], error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.stats).toHaveLength(1)
    expect(body.stats[0].full_name).toBe('Alice Tech')
    expect(body.stats[0].total_assigned).toBe(0)
    expect(body.stats[0].active_assigned).toBe(0)
  })

  it('correctly counts active and completed orders per technician', async () => {
    const now = new Date()
    const twentyDaysAgo = new Date(now - 20 * 86400000).toISOString()
    const fortydaysAgo = new Date(now - 40 * 86400000).toISOString()

    const { supabase } = makeSupabaseMock({
      membersResult: {
        data: [{ user_id: 'u-1', role: 'tech', profiles: { full_name: 'Alice' } }],
        error: null,
      },
      ordersResult: {
        data: [
          // Active order
          { id: 'o-1', assigned_technician_user_id: 'u-1', current_status: 'repairing', intake_received_at: null, shipped_at: null, delivered_at: null },
          // Completed within 30 days
          { id: 'o-2', assigned_technician_user_id: 'u-1', current_status: 'shipped', intake_received_at: fortydaysAgo, shipped_at: twentyDaysAgo, delivered_at: null },
          // Completed outside 30 days (older)
          { id: 'o-3', assigned_technician_user_id: 'u-1', current_status: 'delivered', intake_received_at: null, shipped_at: null, delivered_at: fortydaysAgo },
          // Another tech's order
          { id: 'o-4', assigned_technician_user_id: 'u-2', current_status: 'repairing', intake_received_at: null, shipped_at: null, delivered_at: null },
        ],
        error: null,
      },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    const alice = body.stats[0]
    expect(alice.total_assigned).toBe(3)   // o-1, o-2, o-3
    expect(alice.active_assigned).toBe(1)  // o-1 (repairing is non-terminal)
    expect(alice.completed_last_30d).toBe(1) // o-2 (shipped within 30d)
  })

  it('computes avg_turnaround_days from intake_received_at → shipped_at', async () => {
    const base = new Date('2026-05-01T00:00:00Z')
    const tenDaysLater = new Date(base.getTime() + 10 * 86400000).toISOString()

    const { supabase } = makeSupabaseMock({
      membersResult: {
        data: [{ user_id: 'u-1', role: 'tech', profiles: { full_name: 'Bob' } }],
        error: null,
      },
      ordersResult: {
        data: [
          {
            id: 'o-1',
            assigned_technician_user_id: 'u-1',
            current_status: 'shipped',
            intake_received_at: base.toISOString(),
            shipped_at: tenDaysLater,
            delivered_at: null,
          },
        ],
        error: null,
      },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET()
    const body = await res.json()

    expect(body.stats[0].avg_turnaround_days).toBe(10)
  })
})
