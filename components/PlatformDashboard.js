'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { statusPill } from '../lib/statusPills'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PlatformDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch('/platform/api/stats')
      .then((r) => r.json())
      .then((json) => { if (json.ok) setStats(json); else setError(json.error || 'Failed to load.') })
      .catch(() => setError('Failed to load platform stats.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className='notice' style={{ margin: 32 }}>Loading…</div>
  if (error)   return <div className='notice notice-warn' style={{ margin: 32 }}>{error}</div>

  const kpis = [
    { label: 'Total orgs',  value: stats.total,                    color: 'var(--text)' },
    { label: 'Active',      value: stats.counts.active    || 0,    color: '#15803d' },
    { label: 'Trialing',    value: stats.counts.trialing  || 0,    color: '#b45309' },
    { label: 'Suspended',   value: stats.counts.suspended || 0,    color: '#b91c1c' },
    { label: 'New (30d)',   value: stats.recentCount,               color: '#1d4ed8' },
  ]

  return (
    <div className='page-stack' style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div>
        <div className='kicker'>Platform Admin</div>
        <h1 style={{ margin: '4px 0 6px', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>All organizations across the platform.</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {kpis.map(({ label, value, color }) => (
          <div key={label} className='policy-card' style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Urgent trials warning */}
      {stats.trialUrgent.length > 0 && (
        <div className='notice notice-warn'>
          <strong style={{ display: 'block', marginBottom: 8 }}>
            {stats.trialUrgent.length} org{stats.trialUrgent.length !== 1 ? 's' : ''} with trial expiring in ≤3 days
          </strong>
          {stats.trialUrgent.map((org) => (
            <div key={org.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Link href={`/platform/orgs/${org.id}`} style={{ fontWeight: 600 }}>{org.name}</Link>
              <span style={{ fontSize: '0.8rem', color: org.daysLeft <= 0 ? '#b91c1c' : 'inherit' }}>
                {org.daysLeft <= 0 ? 'Expired' : `${org.daysLeft}d left`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent signups */}
      <div className='policy-card'>
        <div className='kicker'>Recent activity</div>
        <h3 style={{ margin: '2px 0 16px' }}>Latest signups</h3>
        {stats.recentOrgs.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>No organizations yet.</p>
        ) : (
          <div className='preview-meta'>
            {stats.recentOrgs.map((org) => (
              <div key={org.id} className='preview-meta-row'>
                <span>
                  <Link href={`/platform/orgs/${org.id}`} style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {org.name}
                  </Link>
                  <span className='id-mono' style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--muted)' }}>
                    {org.slug}
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={statusPill(org.status).cls}>{statusPill(org.status).label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(org.created_at)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Link href='/platform/orgs' className='button button-secondary' style={{ fontSize: '0.82rem' }}>
            View all organizations →
          </Link>
        </div>
      </div>
    </div>
  )
}
