'use client'

import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n/TranslationProvider'

const TYPE_COLORS = { bug: '#fef2f2', feature: '#eff6ff', general: '#f0fdf4' }
const TYPE_FG = { bug: '#dc2626', feature: '#1d4ed8', general: '#15803d' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export default function PlatformFeedbackPage() {
  const t = useT()
  const [feedback, setFeedback] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const TYPE_LABELS = {
    bug: t('platformAdmin.feedbackTypeBug'),
    feature: t('platformAdmin.feedbackTypeFeature'),
    general: t('platformAdmin.feedbackTypeGeneral'),
  }

  useEffect(() => {
    let cancelled = false
    setTimeout(() => { if (!cancelled) setLoading(true) }, 0)
    const params = new URLSearchParams({ page })
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/platform/api/feedback?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (json.ok) { setFeedback(json.feedback); setTotal(json.total) }
        else setError(json.error || t('platformAdmin.loadFeedbackError'))
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setError(t('platformAdmin.networkError')); setLoading(false) } })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, page])

  const totalPages = Math.ceil(total / 50)

  const FILTERS = [
    { value: '', label: t('platformAdmin.feedbackFilterAll') },
    { value: 'bug', label: t('platformAdmin.feedbackFilterBugs') },
    { value: 'feature', label: t('platformAdmin.feedbackFilterFeatures') },
    { value: 'general', label: t('platformAdmin.feedbackFilterGeneral') },
  ]

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800 }}>{t('platformAdmin.feedbackInbox')}</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>{t('platformAdmin.feedbackTotal', { count: total })}</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setTypeFilter(value); setPage(1) }}
            style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
              border: typeFilter === value ? 'none' : '1px solid #334155',
              background: typeFilter === value ? '#3b82f6' : 'transparent',
              color: typeFilter === value ? '#fff' : '#94a3b8',
              fontWeight: typeFilter === value ? 600 : 400,
            }}
          >{label}</button>
        ))}
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#1e1e1e', borderRadius: 8, color: '#f87171', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ color: '#64748b', padding: 40 }}>{t('platformAdmin.loading')}</div>
      ) : feedback.length === 0 ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: 48 }}>{t('platformAdmin.feedbackEmpty')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feedback.map((item) => (
            <div key={item.id} style={{
              background: '#1a1f2e', border: '1px solid #1e293b',
              borderRadius: 10, padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  background: TYPE_COLORS[item.type],
                  color: TYPE_FG[item.type],
                  padding: '2px 10px', borderRadius: 99,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {TYPE_LABELS[item.type] || item.type}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(item.created_at)}</span>
              </div>
              <p style={{ margin: '0 0 10px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#e2e8f0' }}>
                {item.message}
              </p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                {item.email && <span>📧 {item.email}</span>}
                {item.page_url && <span>📍 {item.page_url}</span>}
                {item.organization_id && <span>🏢 {t('platformAdmin.feedbackOrgPrefix')} {item.organization_id.slice(0, 8)}…</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'center' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
          >{t('platformAdmin.feedbackPrev')}</button>
          <span style={{ padding: '6px 12px', color: '#94a3b8', fontSize: 13 }}>
            {t('platformAdmin.feedbackPageOf', { page, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
          >{t('platformAdmin.feedbackNext')}</button>
        </div>
      )}
    </main>
  )
}
