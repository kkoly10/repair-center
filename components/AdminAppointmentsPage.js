'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { statusPill } from '../lib/statusPills'
import AdminAppointmentCalendar from './AdminAppointmentCalendar'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT, useLocale } from '../lib/i18n/TranslationProvider'

function StatusBadge({ status }) {
  const t = useT()
  const { cls, label } = statusPill(status, t)
  return <span className={cls}>{label}</span>
}

function fmtDatetime(iso, locale) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale || 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function AppointmentRow({ appt, onPatch }) {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [patching, setPatching] = useState(false)
  const [patchError, setPatchError] = useState('')
  const [cancelPending, setCancelPending] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [converting, setConverting] = useState(false)
  const [convertPending, setConvertPending] = useState(false)

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
      if (!res.ok) { setPatchError(json.error || t('adminAppointments.errorUpdate')); return }
      onPatch(json.appointment)
    } catch {
      setPatchError(t('adminAppointments.errorNetwork'))
    } finally {
      setPatching(false)
    }
  }

  async function convertToOrder() {
    setConverting(true)
    setPatchError('')
    try {
      const res = await fetch(`/admin/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert' }),
      })
      const json = await res.json()
      if (!res.ok) { setPatchError(json.error || t('adminAppointments.errorConvert')); return }
      router.push(`/admin/quotes/${json.quoteId}/order`)
    } catch {
      setPatchError(t('adminAppointments.errorNetwork'))
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
      if (!res.ok) { setPatchError(json.error || t('adminAppointments.errorUpdate')); return }
      onPatch(json.appointment)
      setCancelPending(false)
      setCancelReason('')
    } catch {
      setPatchError(t('adminAppointments.errorNetwork'))
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
      <td style={{ padding: '12px 8px', fontSize: 14, whiteSpace: 'nowrap' }}>{fmtDatetime(appt.preferred_at, locale)}</td>
      <td style={{ padding: '12px 8px' }}><StatusBadge status={appt.status} /></td>
      <td style={{ padding: '12px 8px' }}>
        {cancelPending ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type='text'
              className='input'
              placeholder={t('adminAppointments.cancellationReasonPlaceholder')}
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
              >{t('adminAppointments.confirmCancelButton')}</button>
              <button
                className='button button-small'
                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                disabled={patching}
                onClick={() => { setCancelPending(false); setCancelReason('') }}
              >{t('adminAppointments.back')}</button>
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
              >{t('adminAppointments.confirm')}</button>
            )}
            {(appt.status === 'pending' || appt.status === 'confirmed') && (
              <>
                <button
                  className='button button-small'
                  style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                  disabled={patching}
                  onClick={() => patch({ status: 'no_show' })}
                >{t('adminAppointments.noShow')}</button>
                <button
                  className='button button-small'
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                  disabled={patching}
                  onClick={() => setCancelPending(true)}
                >{t('adminAppointments.cancel')}</button>
              </>
            )}
            {appt.status === 'confirmed' && !appt.quote_request_id && (
              convertPending ? (
                <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('adminAppointments.confirmConvert')}</span>
                  <button
                    className='button button-small'
                    style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                    disabled={converting}
                    onClick={() => { setConvertPending(false); convertToOrder() }}
                  >{converting ? t('adminAppointments.converting') : t('adminAppointments.convert')}</button>
                  <button
                    className='button button-small'
                    style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                    disabled={converting}
                    onClick={() => setConvertPending(false)}
                  >{t('adminAppointments.back')}</button>
                </span>
              ) : (
                <button
                  className='button button-small'
                  style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                  disabled={patching}
                  onClick={() => setConvertPending(true)}
                >{t('adminAppointments.convert')}</button>
              )
            )}
            {appt.quote_request_id && (
              <LocalizedLink href={`/admin/quotes/${appt.quote_request_id}`} style={{ fontSize: 12, color: '#6366f1' }}>{t('adminAppointments.viewQuote')}</LocalizedLink>
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
  const t = useT()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [truncated, setTruncated] = useState(false)
  const [view, setView] = useState('list')

  useEffect(() => {
    fetch('/admin/api/appointments')
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d.error || t('adminAppointments.errorLoad')))))
      .then((d) => { setAppointments(d.appointments || []); setTruncated(!!d.truncated); setLoading(false) })
      .catch((err) => { setLoadError(String(err)); setLoading(false) })
  }, [t])

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
          <div className='kicker'>{t('adminAppointments.kicker')}</div>
          <h1>{t('adminAppointments.heading')}</h1>
          <p>{t('adminAppointments.intro')}</p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ key: 'list', label: t('adminAppointments.viewList') }, { key: 'calendar', label: t('adminAppointments.viewCalendar') }].map((v) => (
            <button
              key={v.key}
              type='button'
              onClick={() => setView(v.key)}
              style={{
                padding: '5px 14px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                border: '1px solid var(--line)',
                background: view === v.key ? 'var(--text)' : 'var(--surface)',
                color: view === v.key ? '#fff' : 'var(--muted)',
                fontWeight: view === v.key ? 600 : 400,
              }}
            >{v.label}</button>
          ))}
        </div>

        {view === 'calendar' ? (
          <AdminAppointmentCalendar />
        ) : (
          <>

        {truncated && (
          <div className='notice notice-warn'>
            {t('adminAppointments.truncatedNotice')}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: t('adminAppointments.summaryPending'), value: pendingCount, warn: pendingCount > 0 },
            { label: t('adminAppointments.summaryUpcoming'), value: upcomingConfirmed },
            { label: t('adminAppointments.summaryTotal'), value: counts.all || 0 },
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
              {s === 'all' ? t('adminAppointments.filterAll') : statusPill(s, t).label}{counts[s] ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className='policy-card' style={{ color: 'var(--muted)' }}>{t('adminAppointments.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className='policy-card' style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
            {statusFilter !== 'all'
              ? t('adminAppointments.emptyWithStatus', { status: statusPill(statusFilter, t).label })
              : t('adminAppointments.empty')}
          </div>
        ) : (
          <div className='policy-card' style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table width='100%' style={{ borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                    {[t('adminAppointments.colCustomer'), t('adminAppointments.colDevice'), t('adminAppointments.colPreferredTime'), t('adminAppointments.colStatus'), t('adminAppointments.colActions')].map((h, i) => (
                      <th key={i} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>{h}</th>
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
