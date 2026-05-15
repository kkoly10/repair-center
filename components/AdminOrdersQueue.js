'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { statusPill } from '../lib/statusPills'

const PAGE_SIZE = 25

function buildViewTabs(t) {
  return [
    { value: 'active', label: t('adminOrders.tabActive') },
    { value: 'waiting_parts', label: t('adminOrders.tabWaitingParts') },
    { value: 'awaiting_balance_payment', label: t('adminOrders.tabAwaitingPayment') },
    { value: 'overdue', label: t('adminOrders.tabOverdue') },
    { value: 'completed', label: t('adminOrders.tabCompleted') },
    { value: '', label: t('adminOrders.tabAll') },
  ]
}

const ALLOWED_STATUSES = [
  'awaiting_mail_in',
  'in_transit_to_shop',
  'received',
  'inspection',
  'awaiting_final_approval',
  'approved',
  'waiting_parts',
  'repairing',
  'testing',
  'awaiting_balance_payment',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'declined',
  'returned_unrepaired',
  'beyond_economical_repair',
  'no_fault_found',
]

const ALLOWED_PRIORITIES = ['low', 'normal', 'high', 'urgent']

function formatStatus(status) {
  return (status || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function priorityClass(priority) {
  if (priority === 'urgent') return 'chip chip-error'
  if (priority === 'high') return 'chip chip-warn'
  if (priority === 'low') return 'chip chip-muted'
  return null
}

function formatDue(dueAt, t) {
  if (!dueAt) return null
  const d = new Date(dueAt)
  const now = new Date()
  const diff = d - now
  const overdue = diff < 0
  const days = Math.abs(Math.round(diff / 86400000))
  const label = days === 0
    ? t('adminOrders.dueToday')
    : overdue
      ? t('adminOrders.dueOverdueDays', { days: String(days) })
      : t('adminOrders.dueInDays', { days: String(days) })
  return { label, overdue }
}

export default function AdminOrdersQueue() {
  return (
    <AdminAuthGate>
      <AdminOrdersQueueInner />
    </AdminAuthGate>
  )
}

function AdminOrdersQueueInner() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeView = searchParams.get('status') || 'active'
  const activeTech = searchParams.get('tech') || ''
  const VIEW_TABS = useMemo(() => buildViewTabs(t), [t])

  const [orders, setOrders] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [techs, setTechs] = useState([])
  const [savingId, setSavingId] = useState(null)
  const [saveError, setSaveError] = useState('')

  // Fetch technician list once for dropdowns
  useEffect(() => {
    fetch('/admin/api/team')
      .then((r) => r.json())
      .then((data) => {
        if (data?.members) setTechs(data.members.filter((m) => m.status === 'active'))
      })
      .catch(() => {})
  }, [])

  const loadOrders = useCallback(
    async (ignore = { current: false }) => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        if (activeView) params.set('status', activeView)
        if (activeTech) params.set('tech', activeTech)
        if (searchTerm) params.set('search', searchTerm)
        params.set('page', String(page))

        const res = await fetch(`/admin/api/orders?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || t('adminOrders.errorLoad'))
        if (!ignore.current) {
          setOrders(data.orders || [])
          setTotalCount(data.totalCount || 0)
        }
      } catch (err) {
        if (!ignore.current) setError(err.message)
      } finally {
        if (!ignore.current) setLoading(false)
      }
    },
    [activeView, activeTech, searchTerm, page, t]
  )

  useEffect(() => {
    const ignore = { current: false }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders(ignore)
    return () => { ignore.current = true }
  }, [loadOrders])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const handleViewChange = (view) => {
    setPage(0)
    const p = new URLSearchParams(searchParams.toString())
    if (view) p.set('status', view)
    else p.delete('status')
    p.delete('page')
    router.replace(`/admin/orders?${p}`)
  }

  const handleTechFilter = (techId) => {
    setPage(0)
    const p = new URLSearchParams(searchParams.toString())
    if (techId) p.set('tech', techId)
    else p.delete('tech')
    p.delete('page')
    router.replace(`/admin/orders?${p}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setSearchTerm(searchInput.trim())
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchTerm('')
    setPage(0)
  }

  const patchOrder = async (orderId, payload) => {
    setSavingId(orderId)
    setSaveError('')
    try {
      const res = await fetch(`/admin/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('adminOrders.errorUpdate'))
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, ...data.order, technician_name: o.technician_name } : o
        )
      )
      return true
    } catch (err) {
      setSaveError(err.message)
      return false
    } finally {
      setSavingId(null)
    }
  }

  const handleStatusChange = (orderId, newStatus) => {
    patchOrder(orderId, { status: newStatus })
  }

  const handleTechChange = (orderId, techId) => {
    const tech = techs.find((t) => t.user_id === techId || t.id === techId)
    patchOrder(orderId, { assigned_technician_user_id: techId || null }).then((ok) => {
      if (ok && tech) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, technician_name: tech.full_name || tech.name || null } : o
          )
        )
      }
    })
  }

  const handlePriorityChange = (orderId, newPriority) => {
    patchOrder(orderId, { priority: newPriority })
  }

  const handleDueChange = (orderId, newDueAt) => {
    patchOrder(orderId, { due_at: newDueAt || null })
  }

  const activeViewLabel = useMemo(
    () => VIEW_TABS.find((tab) => tab.value === activeView)?.label || t('adminOrders.tabAll'),
    [activeView, VIEW_TABS, t]
  )

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('adminOrders.kicker')}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>{t('adminOrders.heading')}</h1>
              <p>{t('adminOrders.intro')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href='/admin/api/export/orders' className='button button-secondary' download>{t('adminOrders.exportCsv')}</a>
              <LocalizedLink href='/admin/quotes' className='button button-secondary'>{t('adminOrders.quoteRequests')}</LocalizedLink>
              <AdminSignOutButton />
            </div>
          </div>

          {/* View tabs */}
          <div className='tab-row' style={{ marginTop: 18 }}>
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`tab-btn${activeView === tab.value ? ' active' : ''}`}
                onClick={() => handleViewChange(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters row */}
        <div className='policy-card' style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: '1 1 260px' }}>
              <input
                className='field'
                placeholder={t('adminOrders.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type='submit' className='button button-secondary' style={{ flexShrink: 0 }}>{t('adminOrders.searchButton')}</button>
              {searchTerm ? (
                <button type='button' className='button button-ghost' onClick={clearSearch}>{t('adminOrders.clearSearch')}</button>
              ) : null}
            </form>

            <select
              className='field'
              value={activeTech}
              onChange={(e) => handleTechFilter(e.target.value)}
              style={{ flex: '0 1 200px' }}
            >
              <option value=''>{t('adminOrders.allTechnicians')}</option>
              <option value='unassigned'>{t('adminOrders.unassigned')}</option>
              {techs.map((tech) => (
                <option key={tech.user_id || tech.id} value={tech.user_id || tech.id}>
                  {tech.full_name || tech.name || t('adminOrders.unknown')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {saveError ? (
          <div className='notice notice-error'>{saveError}</div>
        ) : null}

        {error ? (
          <div className='notice notice-error'>{error}</div>
        ) : loading ? (
          <div className='policy-card center-card'>{t('adminOrders.loadingWithView', { view: activeViewLabel.toLowerCase() })}</div>
        ) : !orders.length ? (
          !searchTerm && activeView === 'active'
            ? <FirstOrderGuide />
            : (
              <div className='policy-card center-card'>
                {searchTerm
                  ? t('adminOrders.emptyWithSearch', { view: activeViewLabel.toLowerCase(), search: searchTerm })
                  : t('adminOrders.emptyWithView', { view: activeViewLabel.toLowerCase() })}
              </div>
            )
        ) : (
          <div className='policy-card data-table-scroll-wrap' style={{ padding: 0 }}>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>{t('adminOrders.colOrder')}</th>
                  <th>{t('adminOrders.colCustomer')}</th>
                  <th>{t('adminOrders.colDeviceRepair')}</th>
                  <th>{t('adminOrders.colStatus')}</th>
                  <th>{t('adminOrders.colPriority')}</th>
                  <th>{t('adminOrders.colTechnician')}</th>
                  <th>{t('adminOrders.colDue')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const due = formatDue(order.due_at, t)
                  const isSaving = savingId === order.id
                  return (
                    <tr key={order.id} style={{ opacity: isSaving ? 0.6 : 1 }}>
                      {/* Order number + deposit badge */}
                      <td data-label={t('adminOrders.colOrder')} style={{ whiteSpace: 'nowrap' }}>
                        <div className='id-mono' style={{ fontWeight: 600, fontSize: 13 }}>{order.order_number}</div>
                        {order.quote_id ? (
                          <div className='id-mono' style={{ fontSize: 11, color: 'var(--muted)' }}>{order.quote_id}</div>
                        ) : null}
                        {Number(order.inspection_deposit_required) > 0 && !order.inspection_deposit_paid_at ? (
                          <span className='chip chip-warn' style={{ fontSize: 10, marginTop: 4 }}>{t('adminOrders.depositDue')}</span>
                        ) : null}
                      </td>

                      {/* Customer */}
                      <td data-label={t('adminOrders.colCustomer')}>
                        <div style={{ fontSize: 13 }}>{order.customer_name || '—'}</div>
                        {order.customer_email ? (
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{order.customer_email}</div>
                        ) : null}
                      </td>

                      {/* Device */}
                      <td data-label={t('adminOrders.colDevice')}>
                        <div style={{ fontSize: 13 }}>
                          {[order.brand_name, order.model_name].filter(Boolean).join(' ') || '—'}
                        </div>
                        {order.repair_type_key ? (
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatStatus(order.repair_type_key)}</div>
                        ) : null}
                      </td>

                      {/* Status — inline select */}
                      <td data-label={t('adminOrders.colStatus')}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={statusPill(order.current_status, t).cls}>
                            {statusPill(order.current_status, t).label}
                          </span>
                          <select
                            className='field'
                            value={order.current_status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={isSaving}
                            style={{ fontSize: 11, padding: '2px 6px', minWidth: 140 }}
                          >
                            {ALLOWED_STATUSES.map((s) => (
                              <option key={s} value={s}>{statusPill(s, t).label}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Priority — inline select */}
                      <td data-label={t('adminOrders.colPriority')}>
                        <select
                          className='field'
                          value={order.priority || 'normal'}
                          onChange={(e) => handlePriorityChange(order.id, e.target.value)}
                          disabled={isSaving}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          {ALLOWED_PRIORITIES.map((p) => (
                            <option key={p} value={p}>{t(`adminOrders.priority${p.charAt(0).toUpperCase()}${p.slice(1)}`)}</option>
                          ))}
                        </select>
                        {priorityClass(order.priority) ? (
                          <span className={priorityClass(order.priority)} style={{ fontSize: 10, marginLeft: 4 }}>
                            {t(`adminOrders.priority${(order.priority || '').charAt(0).toUpperCase()}${(order.priority || '').slice(1)}`) || order.priority}
                          </span>
                        ) : null}
                      </td>

                      {/* Technician — inline select */}
                      <td data-label={t('adminOrders.colTech')}>
                        <select
                          className='field'
                          value={order.assigned_technician_user_id || ''}
                          onChange={(e) => handleTechChange(order.id, e.target.value)}
                          disabled={isSaving}
                          style={{ fontSize: 12, padding: '4px 8px', minWidth: 120 }}
                        >
                          <option value=''>{t('adminOrders.unassigned')}</option>
                          {techs.map((tech) => (
                            <option key={tech.user_id || tech.id} value={tech.user_id || tech.id}>
                              {tech.full_name || tech.name || t('adminOrders.unknown')}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Due date — date input */}
                      <td data-label={t('adminOrders.colDue')} style={{ whiteSpace: 'nowrap' }}>
                        <input
                          type='date'
                          className='field'
                          value={order.due_at ? order.due_at.substring(0, 10) : ''}
                          onChange={(e) => handleDueChange(order.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
                          disabled={isSaving}
                          style={{ fontSize: 12, padding: '4px 8px', width: 130 }}
                        />
                        {due ? (
                          <div style={{ fontSize: 11, marginTop: 2, color: due.overdue ? 'var(--error)' : 'var(--muted)' }}>
                            {due.label}
                          </div>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td data-label="" style={{ whiteSpace: 'nowrap' }}>
                        {order.quote_id ? (
                          <LocalizedLink
                            href={`/admin/quotes/${order.quote_id}/order`}
                            className='button button-secondary'
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            {t('adminOrders.open')}
                          </LocalizedLink>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className='pagination' style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            <button
              className='button button-ghost'
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              {t('adminOrders.prev')}
            </button>
            <span style={{ lineHeight: '36px', fontSize: 13 }}>
              {t('adminOrders.pageOf', { page: String(page + 1), total: String(totalPages), count: String(totalCount) })}
            </span>
            <button
              className='button button-ghost'
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('adminOrders.next')}
            </button>
          </div>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            {totalCount === 1
              ? t('adminOrders.orderCountOne', { count: String(totalCount) })
              : t('adminOrders.orderCountOther', { count: String(totalCount) })}
          </p>
        )}
      </div>
    </main>
  )
}

function FirstOrderGuide() {
  const t = useT()
  return (
    <div className='policy-card' style={{ padding: '32px 28px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔧</div>
      <h2 style={{ marginTop: 0, marginBottom: 8, letterSpacing: '-0.02em' }}>{t('adminOrders.emptyQueueHeading')}</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
        {t('adminOrders.emptyQueueBody')}
      </p>

      <div style={{
        background: 'var(--surface-alt, var(--surface))',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        marginBottom: 24,
        opacity: 0.55,
        fontSize: '0.85rem',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warn, #f59e0b)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem' }}>RCO-001</div>
          <div style={{ color: 'var(--muted)' }}>{t('adminOrders.mockOrderCustomer')}</div>
        </div>
        <div style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{t('adminOrders.mockOrderStatus')}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <LocalizedLink href='/admin/quotes' className='button button-secondary button-compact'>
          {t('adminOrders.createQuoteCta')}
        </LocalizedLink>
        <LocalizedLink href='/admin/team' className='button button-ghost button-compact'>
          {t('adminOrders.inviteTechCta')}
        </LocalizedLink>
      </div>
    </div>
  )
}
