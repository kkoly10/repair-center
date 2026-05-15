'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { statusPill } from '../lib/statusPills'
import AdminAppointmentCalendar from './AdminAppointmentCalendar'

function StatusBadge({ status }) {
  const { cls, label } = statusPill(status)
  return <span className={cls}>{label}</span>
}

function fmtDatetime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function AppointmentRow({ appt, onPatch }) {
  const router = useRouter()
  const [patching, setPatching] = useState(false)
  const [patchError, setPatchError] = useState('')
  const [cancelPending, setCancelPending] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [converting, setConverting] = useState(false)

  async function patch(update) {
    setPatching(true)
    setPatchError('')
    try {
      const res = await fetch(`/admin/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      const json = await res.json()
      if (!res.ok) { setPatchError(json.error || 'Failed to update.'); return }
      onPatch(json.appointment)
    } catch {
      setPatchError('Network error. Please try again.')
    } finally {
      setPatching(false)
    }
  }

  async function convertToOrder() {
    if (!window.confirm('Convert this appointment to a walk-in repair order?')) return
    setConverting(true)
    setPatchError('')
    try {
      const res = await fetch(`/admin/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert' }),
      })
      const json = await res.json()
      if (!res.ok) { setPatchError(json.error || 'Conversion failed.'); return }
      router.push(`/admin/quotes/${json.quoteId}/order`)
    } catch {
      setPatchError('Network error. Please try again.')
    } finally {
      setConverting(false)
    }
  }

  async function confirmCancel() {
    setPatching(true)
    setPatchError('')
    try {
      const res = await fetch(`/admin/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancellation_reason: cancelReason.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) { setPatchError(json.error || 'Failed to update.'); return }
      onPatch(json.appointment)
      setCancelPending(false)
      setCancelReason('')
    } catch {
      setPatchError('Network error. Please try again.')
    } finally {
      setPatching(false)
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '12px 8px' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{[appt.first_name, appt.last_name].filter(Boolean).join(' ')}</div>
        <div style={{ fontSize: 12, color: '#888' }}>{appt.email}{appt.phone ? ` · ${appt.phone}` : ''}</div>
      </td>
      <td style={{ padding: '12px 8px', fontSize: 14 }}>
        {[appt.brand_name, appt.model_name].filter(Boolean).join(' ') || <span style={{ color: '#aaa' }}>—</span>}
        {appt.repair_description && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.repair_description}</div>
        )}
      </td>
      <td style={{ padding: '12px 8px', fontSize: 14, whiteSpace: 'nowrap' }}>{fmtDatetime(appt.preferred_at)}</td>
      <td style={{ padding: '12px 8px' }}><StatusBadge status={appt.status} /></td>
      <td style={{ padding: '12px 8px' }}>
        {cancelPending ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type='text'
              className='input'
              placeholder='Cancellation reason (optional)'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className='button button-small'
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                disabled={patching}
                onClick={confirmCancel}
              >Confirm cancel</button>
              <button
                className='button button-small'
                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                disabled={patching}
                onClick={() => { setCancelPending(false); setCancelReason('') }}
              >Back</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {appt.status === 'pending' && (
              <button
                className='button button-small'
                style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                disabled={patching}
                onClick={() => patch({ status: 'confirmed' })}
              >Confirm</button>
            )}
            {(appt.status === 'pending' || appt.status === 'confirmed') && (
              <>
                <button
                  className='button button-small'
                  style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                  disabled={patching}
                  onClick={() => patch({ status: 'no_show' })}
                >No-show</button>
                <button
                  className='button button-small'
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                  disabled={patching}
                  onClick={() => setCancelPending(true)}
                >Cancel</button>
              </>
            )}
            {appt.status === 'confirmed' && !appt.quote_request_id && (
              <button
                className='button button-small'
                style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                disabled={patching || converting}
                onClick={convertToOrder}
              >{converting ? 'Converting…' : 'Convert →'}</button>
            )}
            {appt.quote_request_id && (
              <Link href={`/admin/quotes/${appt.quote_request_id}`} style={{ fontSize: 12, color: '#6366f1' }}>View quote →</Link>
            )}
          </div>
        )}
        {patchError && (
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--danger, #dc2626)' }}>{patchError}</div>
        )}
      </td>
    </tr>
  )
}

function AdminAppointmentsInner() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [truncated, setTruncated] = useState(false)
  const [view, setView] = useState('list')

  useEffect(() => {
    fetch('/admin/api/appointments')
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d.error || 'Failed'))))
      .then((d) => { setAppointments(d.appointments || []); setTruncated(!!d.truncated); setLoading(false) })
      .catch((err) => { setLoadError(String(err)); setLoading(false) })
  }, [])

  function handlePatch(updated) {
    setAppointments((prev) => prev.map((a) => a.id === updated.id ? updated : a))
  }

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return appointments
    return appointments.filter((a) => a.status === statusFilter)
  }, [appointments, statusFilter])

  const counts = useMemo(() => {
    const c = { all: appointments.length }
    for (const a of appointments) c[a.status] = (c[a.status] || 0) + 1
    return c
  }, [appointments])

  const pendingCount = counts.pending || 0
  const upcomingConfirmed = appointments.filter((a) => a.status === 'confirmed' && new Date(a.preferred_at) >= new Date()).length

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Admin — Appointments</div>
          <h1>Appointments</h1>
          <p>Manage drop-off appointment requests from customers.</p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['list', 'calendar'].map((v) => (
            <button
              key={v}
              type='button'
              onClick={() => setView(v)}
              style={{
                padding: '5px 14px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                border: '1px solid var(--line)',
                background: view === v ? 'var(--text)' : 'var(--surface)',
                color: view === v ? '#fff' : 'var(--muted)',
                fontWeight: view === v ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >{v}</button>
          ))}
        </div>

        {view === 'calendar' ? (
          <AdminAppointmentCalendar />
        ) : (
          <>

        {truncated && (
          <div className='notice notice-warn'>
            Showing the first 500 appointments. Export or filter by date range to see older records.
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Pending review', value: pendingCount, warn: pendingCount > 0 },
            { label: 'Upcoming', value: upcomingConfirmed },
            { label: 'Total', value: counts.all || 0 },
          ].map(({ label, value, warn }) => (
            <div key={label} className='info-card' style={{ padding: '14px 16px', background: warn ? '#fffbeb' : undefined }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: warn ? '#92400e' : '#111' }}>{value}</div>
              <div style={{ fontSize: 12, color: warn ? '#92400e' : '#888', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {loadError && <div className='notice-error'>{loadError}</div>}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'pending', 'confirmed', 'cancelled', 'no_show', 'converted'].map((s) => (
            <button
              key={s}
              type='button'
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 13, cursor: 'pointer', border: '1px solid #ddd',
                background: statusFilter === s ? '#111' : '#fff',
                color: statusFilter === s ? '#fff' : '#555',
                fontWeight: statusFilter === s ? 600 : 400,
              }}
            >
              {s === 'all' ? 'All' : statusPill(s).label}{counts[s] ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className='policy-card' style={{ color: 'var(--muted)' }}>Loading appointments…</div>
        ) : filtered.length === 0 ? (
          <div className='policy-card' style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
            No appointments{statusFilter !== 'all' ? ` with status "${statusPill(statusFilter).label}"` : ''}.
          </div>
        ) : (
          <div className='policy-card' style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table width='100%' style={{ borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                    {['Customer', 'Device', 'Preferred time', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((appt) => (
                    <AppointmentRow key={appt.id} appt={appt} onPatch={handlePatch} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          </>
        )}
      </div>
    </main>
  )
}

export default function AdminAppointmentsPage() {
  return <AdminAppointmentsInner />
}
