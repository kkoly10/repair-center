'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function StarDisplay({ rating, size = 16 }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/admin/api/reviews')
      .then((r) => r.json())
      .then((json) => { if (json.ok) setData(json) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const reviews = data?.reviews || []
  const summary = data?.summary || { total: 0, avgRating: 0, distribution: {} }

  const filtered = reviews.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (r.customerName || '').toLowerCase().includes(q) ||
      (r.device || '').toLowerCase().includes(q) ||
      (r.comment || '').toLowerCase().includes(q) ||
      (r.quoteId || '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: '1.5rem', fontWeight: 700 }}>Customer Reviews</h1>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div className='card' style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 6 }}>Total Reviews</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.total}</div>
            </div>
            <div className='card' style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 6 }}>Avg Rating</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.total > 0 ? summary.avgRating.toFixed(1) : '—'}</div>
              {summary.total > 0 && <StarDisplay rating={Math.round(summary.avgRating)} size={14} />}
            </div>
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className='card' style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: '#f59e0b' }}>★</span>
                  <span style={{ fontWeight: 600 }}>{star}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.distribution[star] || 0}</div>
                {summary.total > 0 && (
                  <div style={{ marginTop: 4, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: '#f59e0b',
                      width: `${Math.round(((summary.distribution[star] || 0) / summary.total) * 100)}%`,
                      borderRadius: 2,
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input
              type='search'
              placeholder='Search by customer, device, or comment…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                maxWidth: 360,
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border, rgba(255,255,255,0.12))',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Reviews table */}
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>{reviews.length === 0 ? 'No reviews yet.' : 'No reviews match your search.'}</p>
          ) : (
            <div className='card' style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
                    {['Rating', 'Customer', 'Device', 'Comment', 'Date'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))' }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <StarDisplay rating={r.rating} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                        {r.quoteId ? (
                          <Link href={`/admin/quotes/${r.quoteId}`} style={{ color: 'var(--accent, #818cf8)', textDecoration: 'none' }}>
                            {r.customerName || r.quoteId}
                          </Link>
                        ) : (r.customerName || '—')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--muted)' }}>
                        {r.device || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', maxWidth: 300 }}>
                        {r.comment ? (
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {r.comment}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
