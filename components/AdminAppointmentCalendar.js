'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { statusPill } from '../lib/statusPills'
import { useT, useLocale } from '../lib/i18n/TranslationProvider'

function getMonday(d) {
  const copy = new Date(d)
  const day = copy.getDay()
  copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1))
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d, n) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function toGridLine(iso) {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = d.getMinutes() < 30 ? '00' : '30'
  return `time-${h}${m}`
}

function dayColIndex(iso) {
  const day = new Date(iso).getDay() // 0=Sun
  return day === 0 ? 6 : day - 1     // Mon=0 … Sun=6
}

function buildGridRows() {
  const rows = []
  for (let h = 8; h < 20; h++) {
    rows.push(`[time-${String(h).padStart(2, '0')}00] 32px`)
    rows.push(`[time-${String(h).padStart(2, '0')}30] 32px`)
  }
  rows.push('[time-2000]')
  return rows.join(' ')
}

function buildTimeLabels(locale) {
  return Array.from({ length: 12 }, (_, i) => {
    const h = i + 8
    const dt = new Date()
    dt.setHours(h, 0, 0, 0)
    const label = new Intl.DateTimeFormat(locale || 'en-US', { hour: 'numeric' }).format(dt)
    return { line: `time-${String(h).padStart(2, '0')}00`, label }
  })
}

function fmtDatetime(iso, locale) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale || 'en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

export default function AdminAppointmentCalendar() {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const TIME_LABELS = buildTimeLabels(locale)
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [appointments, setAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [singleDay, setSingleDay] = useState(false)
  const [dayOffset, setDayOffset] = useState(0)
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState('')
  const [convertPending, setConvertPending] = useState(false)

  // Detect mobile width — deferred to avoid SSR/hydration mismatch
  useEffect(() => {
    function check() { setTimeout(() => setSingleDay(window.innerWidth < 640), 0) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Set dayOffset to today on mount — deferred to avoid set-state-in-effect lint error
  useEffect(() => {
    const d = new Date().getDay()
    setTimeout(() => setDayOffset(d === 0 ? 6 : d - 1), 0)
  }, [])

  useEffect(() => {
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    setTimeout(() => setLoading(true), 0)
    fetch(`/admin/api/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(r => r.json())
      .then(json => { setAppts(json.appointments || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [weekStart])

  const visibleDays = singleDay ? 1 : 7
  const dayStartIndex = singleDay ? dayOffset : 0
  const todayIso = new Date().toISOString().slice(0, 10)

  const days = Array.from({ length: visibleDays }, (_, i) => {
    const d = addDays(weekStart, dayStartIndex + i)
    return {
      isoDate: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(locale || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    }
  })

  const visibleAppts = appointments.filter(appt => {
    const h = new Date(appt.preferred_at).getHours()
    const col = dayColIndex(appt.preferred_at)
    return h >= 8 && h < 20 && col >= dayStartIndex && col < dayStartIndex + visibleDays
  })

  const selectedAppt = appointments.find(a => a.id === selectedId)

  function prev() {
    if (singleDay) {
      if (dayOffset > 0) setDayOffset(o => o - 1)
      else { setWeekStart(d => addDays(d, -7)); setDayOffset(6) }
    } else {
      setWeekStart(d => addDays(d, -7))
    }
  }
  function next() {
    if (singleDay) {
      if (dayOffset < 6) setDayOffset(o => o + 1)
      else { setWeekStart(d => addDays(d, 7)); setDayOffset(0) }
    } else {
      setWeekStart(d => addDays(d, 7))
    }
  }
  function today() {
    setWeekStart(getMonday(new Date()))
    const d = new Date().getDay()
    setDayOffset(d === 0 ? 6 : d - 1)
  }

  async function convertToOrder(apptId) {
    setConverting(true)
    setConvertError('')
    try {
      const res = await fetch(`/admin/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert' }),
      })
      const json = await res.json()
      if (!res.ok) { setConvertError(json.error || t('adminAppointments.errorConvert')); setConverting(false); return }
      router.push(`/admin/quotes/${json.quoteId}/order`)
    } catch {
      setConvertError(t('adminAppointments.errorNetworkShort'))
      setConverting(false)
    }
  }

  const weekLabel = singleDay
    ? days[0]?.label
    : `${weekStart.toLocaleDateString(locale || 'en-US', { month: 'short', day: 'numeric' })} – ${addDays(weekStart, 6).toLocaleDateString(locale || 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const cols = `60px repeat(${visibleDays}, 1fr)`

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className='button button-secondary' style={{ fontSize: 13, padding: '4px 10px' }} onClick={prev}>{t('adminAppointments.calPrev')}</button>
        <button className='button button-secondary' style={{ fontSize: 13, padding: '4px 10px' }} onClick={today}>{t('adminAppointments.calToday')}</button>
        <button className='button button-secondary' style={{ fontSize: 13, padding: '4px 10px' }} onClick={next}>{t('adminAppointments.calNext')}</button>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{weekLabel}</span>
        {loading && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('adminAppointments.loading')}</span>}
      </div>

      <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {/* Day header row */}
        <div style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: '2px solid var(--line)', background: 'var(--surface-alt)' }}>
          <div />
          {days.map(d => (
            <div
              key={d.isoDate}
              style={{
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 700,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: d.isoDate === todayIso ? 'var(--blue)' : 'var(--muted)',
              }}
            >
              {d.label}
            </div>
          ))}
        </div>

        {/* Scrollable time grid */}
        <div style={{ overflowY: 'auto', maxHeight: '62vh' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: cols,
              gridTemplateRows: buildGridRows(),
              position: 'relative',
            }}
          >
            {/* Time labels */}
            {TIME_LABELS.map(({ line, label }) => (
              <div
                key={line}
                style={{
                  gridColumn: 1,
                  gridRowStart: line,
                  fontSize: 10,
                  color: 'var(--muted)',
                  paddingRight: 8,
                  textAlign: 'right',
                  lineHeight: '32px',
                  userSelect: 'none',
                }}
              >
                {label}
              </div>
            ))}

            {/* Horizontal grid lines (one per hour) */}
            {TIME_LABELS.map(({ line }) => (
              <div
                key={`gl-${line}`}
                style={{
                  gridColumn: `2 / ${visibleDays + 2}`,
                  gridRowStart: line,
                  gridRowEnd: 'span 2',
                  borderTop: '1px solid var(--line)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            ))}

            {/* Appointment blocks */}
            {visibleAppts.map(appt => {
              const col = dayColIndex(appt.preferred_at) - dayStartIndex + 2
              const startLine = toGridLine(appt.preferred_at)
              const isSelected = appt.id === selectedId
              const faded = appt.status === 'cancelled' || appt.status === 'no_show'
              return (
                <div
                  key={appt.id}
                  onClick={() => setSelectedId(appt.id === selectedId ? null : appt.id)}
                  style={{
                    gridColumn: col,
                    gridRowStart: startLine,
                    gridRowEnd: 'span 2',
                    margin: '1px 3px',
                    background: 'var(--blue-soft)',
                    border: `1px ${appt.status === 'pending' ? 'dashed' : 'solid'} var(--blue)`,
                    borderLeft: '3px solid var(--blue)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 5px',
                    fontSize: '0.7rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    opacity: faded ? 0.45 : 1,
                    outline: isSelected ? '2px solid var(--blue-strong)' : 'none',
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {appt.first_name} {appt.last_name}
                  </div>
                  <div style={{ color: 'var(--muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {[appt.brand_name, appt.model_name].filter(Boolean).join(' ') || appt.repair_description?.slice(0, 24)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected appointment detail panel */}
      {selectedAppt && (
        <div style={{ marginTop: 12, padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {selectedAppt.first_name} {selectedAppt.last_name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                {selectedAppt.email}{selectedAppt.phone ? ` · ${selectedAppt.phone}` : ''}
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {[selectedAppt.brand_name, selectedAppt.model_name].filter(Boolean).join(' ') || '—'}
                {selectedAppt.repair_description && (
                  <span style={{ color: 'var(--muted)', marginLeft: 6 }}>· {selectedAppt.repair_description}</span>
                )}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={statusPill(selectedAppt.status, t).cls}>{statusPill(selectedAppt.status, t).label}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDatetime(selectedAppt.preferred_at, locale)}</span>
              </div>
              {selectedAppt.status === 'confirmed' && !selectedAppt.quote_request_id && (
                <div style={{ marginTop: 10 }}>
                  {convertPending ? (
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('adminAppointments.confirmConvert')}</span>
                      <button
                        className='button button-secondary'
                        style={{ fontSize: 12, padding: '4px 12px' }}
                        disabled={converting}
                        onClick={() => { setConvertPending(false); convertToOrder(selectedAppt.id) }}
                      >{converting ? t('adminAppointments.converting') : t('adminAppointments.convert')}</button>
                      <button
                        className='button button-secondary'
                        style={{ fontSize: 12, padding: '4px 12px' }}
                        disabled={converting}
                        onClick={() => setConvertPending(false)}
                      >{t('adminAppointments.back')}</button>
                    </span>
                  ) : (
                    <button
                      className='button button-secondary'
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      disabled={converting}
                      onClick={() => setConvertPending(true)}
                    >{t('adminAppointments.convertToOrder')}</button>
                  )}
                  {convertError && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--danger, #dc2626)' }}>{convertError}</div>}
                </div>
              )}
              {selectedAppt.quote_request_id && (
                <div style={{ marginTop: 10 }}>
                  <Link href={`/admin/quotes/${selectedAppt.quote_request_id}/order`} style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>{t('adminAppointments.viewOrder')}</Link>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, padding: 0, lineHeight: 1, flexShrink: 0 }}
            >×</button>
          </div>
        </div>
      )}

      {visibleAppts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: 13 }}>
          {t('adminAppointments.calendarEmpty')}
        </div>
      )}
    </div>
  )
}
