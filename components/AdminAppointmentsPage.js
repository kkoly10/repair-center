'use client'
import { useState, useEffect, useMemo } from 'react'

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
  converted: 'Converted',
}

const STATUS_COLORS = {
  pending: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  confirmed: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  no_show: { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' },
  converted: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
}

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.pending
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: style.bg, color: style.color, border: `1px solid ${style.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function fmtDatetime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function AppointmentRow({ appt, onPatch }) {
  const [patching, setPatching] = useState(false)

  async function patch(update) {
    setPatching(true)
    try {
      const res = await fetch(`/admin/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error || 'Failed to update.'); return }
      onPatch(json.appointment)
    } catch {
      alert('Network error.')
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
                onClick={() => {
                  const reason = prompt('Cancellation reason (optional):')
                  if (reason === null) return
                  patch({ status: 'cancelled', cancellation_reason: reason || null })
                }}
              >Cancel</button>
            </>
          )}
          {appt.status === 'confirmed' && !appt.quote_request_id && (
            <a
              href={`/admin/quotes/new?appointmentId=${appt.id}&firstName=${encodeURIComponent(appt.first_name || '')}&lastName=${encodeURIComponent(appt.last_name || '')}&email=${encodeURIComponent(appt.email || '')}&brandName=${encodeURIComponent(appt.brand_name || '')}&modelName=${encodeURIComponent(appt.model_name || '')}`}
              className='button button-small'
              style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12 }}
            >→ New Quote</a>
          )}
          {appt.quote_request_id && (
            <a href={`/admin/quotes/${appt.quote_request_id}`} style={{ fontSize: 12, color: '#6366f1' }}>View quote →</a>
          )}
        </div>
      </td>
    </tr>
  )
}

function AdminAppointmentsInner() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/admin/api/appointments')
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d.error || 'Failed'))))
      .then((d) => { setAppointments(d.appointments || []); setLoading(false) })
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
              {s === 'all' ? 'All' : STATUS_LABELS[s]}{counts[s] ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className='policy-card' style={{ color: 'var(--muted)' }}>Loading appointments…</div>
        ) : filtered.length === 0 ? (
          <div className='policy-card' style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
            No appointments{statusFilter !== 'all' ? ` with status "${STATUS_LABELS[statusFilter]}"` : ''}.
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
      </div>
    </main>
  )
}

export default function AdminAppointmentsPage() {
  return <AdminAppointmentsInner />
}
