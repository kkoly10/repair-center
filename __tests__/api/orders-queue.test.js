/**
 * Multi-tenant safety: GET /admin/api/orders and PATCH /admin/api/orders/[orderId]
 *
 * Invariants:
 *  - Both endpoints require authentication (401 if not)
 *  - GET always scopes queries by organization_id
 *  - PATCH verifies order ownership before mutating (cross-org attempt → 404)
 *  - PATCH update query always includes organization_id filter
 *  - PATCH supports notes field; writes audit entry
 *  - PATCH fires sendRepairStatusNotification for customer-facing status transitions
 *  - PATCH does NOT notify for non-customer-facing status transitions
 */

jest.mock('../../lib/admin/getSessionOrgId')
jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/notifications')

const { getSessionOrgId, getSessionContext } = require('../../lib/admin/getSessionOrgId')
const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { sendRepairStatusNotification } = require('../../lib/notifications')
const { GET } = require('../../app/admin/api/orders/route')
const { PATCH } = require('../../app/admin/api/orders/[orderId]/route')
const { createSupabaseMock, getChain } = require('../helpers/supabaseMock')

function makeCtx(orderId) {
  return { params: Promise.resolve({ orderId }) }
}

function makeRequest(body) {
  return { json: async () => body, url: 'http://localhost/admin/api/orders' }
}

// ─── GET /admin/api/orders ────────────────────────────────────────────────────

describe('GET /admin/api/orders', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))

    const res = await GET({ url: 'http://localhost/admin/api/orders' })

    expect(res.status).toBe(401)
  })

  it('always includes organization_id filter in the list query', async () => {
    const supabase = createSupabaseMock({ repair_orders: { data: [], error: null, count: 0 } })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    await GET({ url: 'http://localhost/admin/api/orders' })

    const ordersChain = getChain(supabase, 'repair_orders', 0)
    expect(ordersChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
  })

  it('returns ok:true with an orders array on success', async () => {
    const supabase = createSupabaseMock({
      repair_orders: {
        data: [
          {
            id: 'ro-1',
            order_number: 'RCO-001',
            current_status: 'repairing',
            priority: 'normal',
            due_at: null,
            inspection_deposit_required: '0',
            inspection_deposit_paid_at: null,
            assigned_technician_user_id: null,
            created_at: '2026-05-10T00:00:00Z',
            updated_at: '2026-05-10T00:00:00Z',
            quote_requests: { id: 'qr-1', quote_id: 'RCQ-001', brand_name: 'Apple', model_name: 'iPhone 14', repair_type_key: 'screen' },
            customers: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', phone: null },
            profiles: null,
          },
        ],
        error: null,
        count: 1,
      },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionOrgId.mockResolvedValue('org-a')

    const res = await GET({ url: 'http://localhost/admin/api/orders' })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.orders).toHaveLength(1)
    expect(body.orders[0].order_number).toBe('RCO-001')
    expect(body.orders[0].customer_name).toBe('Jane Doe')
    expect(body.totalCount).toBe(1)
  })
})

// ─── PATCH /admin/api/orders/[orderId] ───────────────────────────────────────

describe('PATCH /admin/api/orders/[orderId]', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    getSessionContext.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))

    const res = await PATCH(makeRequest({ status: 'repairing' }), makeCtx('ro-1'))

    expect(res.status).toBe(401)
  })

  it('returns 404 when the order does not belong to the session org', async () => {
    const supabase = createSupabaseMock({ repair_orders: { data: null, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    const res = await PATCH(makeRequest({ status: 'repairing' }), makeCtx('ro-org-b'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toMatch(/not found/i)
  })

  it('includes organization_id filter on both the fetch and update queries', async () => {
    const orderData = {
      id: 'ro-1',
      order_number: 'RCO-001',
      current_status: 'inspection',
      priority: 'normal',
      due_at: null,
      notes: null,
      quote_request_id: 'qr-1',
      assigned_technician_user_id: null,
      intake_received_at: null,
      repair_started_at: null,
      repair_completed_at: null,
      shipped_at: null,
      delivered_at: null,
    }
    const updatedOrder = { id: 'ro-1', order_number: 'RCO-001', current_status: 'repairing', priority: 'normal', due_at: null, assigned_technician_user_id: null }
    const supabase = createSupabaseMock({
      repair_orders: [
        { data: orderData, error: null }, // fetch (maybySingle)
        { data: updatedOrder, error: null }, // update (single)
      ],
      repair_order_audit_log: { data: null, error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    await PATCH(makeRequest({ status: 'repairing' }), makeCtx('ro-1'))

    const fetchChain = getChain(supabase, 'repair_orders', 0)
    const updateChain = getChain(supabase, 'repair_orders', 1)
    expect(fetchChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
    expect(updateChain.eq).toHaveBeenCalledWith('organization_id', 'org-a')
  })

  it('returns 400 for invalid status value', async () => {
    const supabase = createSupabaseMock({
      repair_orders: { data: { id: 'ro-1', order_number: 'RCO-001', current_status: 'inspection', priority: 'normal', due_at: null, assigned_technician_user_id: null }, error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    const res = await PATCH(makeRequest({ status: 'hacked_status' }), makeCtx('ro-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/invalid status/i)
  })

  it('returns 400 for invalid priority value', async () => {
    const supabase = createSupabaseMock({
      repair_orders: { data: { id: 'ro-1', order_number: 'RCO-001', current_status: 'inspection', priority: 'normal', due_at: null, assigned_technician_user_id: null }, error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    const res = await PATCH(makeRequest({ priority: 'critical' }), makeCtx('ro-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/invalid priority/i)
  })

  it('happy path: priority + due_at update returns ok and writes audit entries', async () => {
    const orderData = {
      id: 'ro-1',
      order_number: 'RCO-001',
      current_status: 'repairing',
      priority: 'normal',
      due_at: null,
      notes: null,
      quote_request_id: 'qr-1',
      assigned_technician_user_id: null,
      intake_received_at: null,
      repair_started_at: null,
      repair_completed_at: null,
      shipped_at: null,
      delivered_at: null,
    }
    const supabase = createSupabaseMock({
      repair_orders: [
        { data: orderData, error: null }, // fetch
        { data: { id: 'ro-1', order_number: 'RCO-001', current_status: 'repairing', priority: 'high', due_at: '2026-05-15T00:00:00Z', assigned_technician_user_id: null }, error: null }, // update
      ],
      repair_order_audit_log: { data: null, error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    const res = await PATCH(
      makeRequest({ priority: 'high', due_at: '2026-05-15T00:00:00Z' }),
      makeCtx('ro-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.order.priority).toBe('high')
    const auditChain = getChain(supabase, 'repair_order_audit_log', 0)
    expect(auditChain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ event_type: 'priority_changed', old_value: 'normal', new_value: 'high' }),
        expect.objectContaining({ event_type: 'due_date_changed', new_value: '2026-05-15T00:00:00Z' }),
      ])
    )
  })

  it('saves notes and writes a note_updated audit entry', async () => {
    const orderData = {
      id: 'ro-1',
      order_number: 'RCO-001',
      current_status: 'repairing',
      priority: 'normal',
      due_at: null,
      notes: 'old note',
      quote_request_id: 'qr-1',
      assigned_technician_user_id: null,
      intake_received_at: null,
      repair_started_at: null,
      repair_completed_at: null,
      shipped_at: null,
      delivered_at: null,
    }
    const supabase = createSupabaseMock({
      repair_orders: [
        { data: orderData, error: null }, // fetch
        { data: { id: 'ro-1', order_number: 'RCO-001', current_status: 'repairing', priority: 'normal', due_at: null, notes: 'new note', assigned_technician_user_id: null }, error: null }, // update
      ],
      repair_order_audit_log: { data: null, error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    const res = await PATCH(makeRequest({ notes: 'new note' }), makeCtx('ro-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    const auditChain = getChain(supabase, 'repair_order_audit_log', 0)
    expect(auditChain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ event_type: 'note_updated', old_value: 'old note', new_value: 'new note' }),
      ])
    )
  })

  it('fires sendRepairStatusNotification for customer-facing status transitions', async () => {
    sendRepairStatusNotification.mockResolvedValue({ ok: true })

    const orderData = {
      id: 'ro-1',
      order_number: 'RCO-001',
      current_status: 'repairing',
      priority: 'normal',
      due_at: null,
      notes: null,
      quote_request_id: 'qr-1',
      assigned_technician_user_id: null,
      intake_received_at: null,
      repair_started_at: null,
      repair_completed_at: null,
      shipped_at: null,
      delivered_at: null,
    }
    const supabase = createSupabaseMock({
      repair_orders: [
        { data: orderData, error: null }, // fetch
        { data: { id: 'ro-1', order_number: 'RCO-001', current_status: 'awaiting_balance_payment', priority: 'normal', due_at: null, notes: null, assigned_technician_user_id: null }, error: null }, // update
      ],
      repair_order_audit_log: { data: null, error: null },
      repair_order_status_history: { data: { id: 'hist-1' }, error: null }, // history fetch for dedup key
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    const res = await PATCH(makeRequest({ status: 'awaiting_balance_payment' }), makeCtx('ro-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(sendRepairStatusNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        quoteRequestId: 'qr-1',
        repairOrderId: 'ro-1',
        historyId: 'hist-1',
        status: 'awaiting_balance_payment',
      })
    )
  })

  it('does NOT fire sendRepairStatusNotification for internal-only status transitions', async () => {
    sendRepairStatusNotification.mockResolvedValue({ ok: true })

    const orderData = {
      id: 'ro-1',
      order_number: 'RCO-001',
      current_status: 'received',
      priority: 'normal',
      due_at: null,
      notes: null,
      quote_request_id: 'qr-1',
      assigned_technician_user_id: null,
      intake_received_at: null,
      repair_started_at: null,
      repair_completed_at: null,
      shipped_at: null,
      delivered_at: null,
    }
    const supabase = createSupabaseMock({
      repair_orders: [
        { data: orderData, error: null }, // fetch
        { data: { id: 'ro-1', order_number: 'RCO-001', current_status: 'waiting_parts', priority: 'normal', due_at: null, notes: null, assigned_technician_user_id: null }, error: null }, // update
      ],
      repair_order_audit_log: { data: null, error: null },
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    getSessionContext.mockResolvedValue({ orgId: 'org-a', userId: 'user-1' })

    await PATCH(makeRequest({ status: 'waiting_parts' }), makeCtx('ro-1'))

    expect(sendRepairStatusNotification).not.toHaveBeenCalled()
  })
})
