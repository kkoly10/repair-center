'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { statusPill } from '../lib/statusPills'

const STATUS_FILTERS = ['all', 'active', 'trialing', 'past_due', 'suspended', 'cancelled']

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PlatformOrgsPage() {
  const [orgs,         setOrgs]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/platform/api/orgs')
      .then((r) => r.json())
      .then((json) => { if (json.ok) setOrgs(json.orgs); else setError(json.error || 'Failed to load.') })
      .catch(() => setError('Failed to load organizations.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orgs.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) return <div className='notice' style={{ margin: 32 }}>Loading…</div>
  if (error)   return <div className='notice notice-warn' style={{ margin: 32 }}>{error}</div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <div className='kicker'>Platform Admin</div>
          <h1 style={{ margin: '4px 0 0', letterSpacing: '-0.02em' }}>Organizations</h1>
        </div>
        <input
          type='search'
          className='search-box'
          placeholder='Search name or slug…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => {
          const cnt = s === 'all' ? orgs.length : orgs.filter((o) => o.status === s).length
          if (s !== 'all' && cnt === 0) return null
          const active = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`button ${active ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            >
              {s === 'all' ? 'All' : statusPill(s).label} ({cnt})
            </button>
          )
        })}
      </div>

      <div className='policy-card' style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-deep)' }}>
              {['Organization', 'Status', 'Plan', 'Trial / Renewal', 'Members', 'Joined'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: '0.72rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--muted)', whiteSpace: 'nowrap',
                  }}
                >{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px 16px', color: 'var(--muted)', textAlign: 'center', fontSize: '0.875rem' }}>
                  No organizations found.
                </td>
              </tr>
            ) : filtered.map((org) => {
              const renewalDate = org.subscription?.current_period_end || org.trial_ends_at
              return (
                <tr key={org.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/platform/orgs/${org.id}`} style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {org.name}
                    </Link>
                    <div className='id-mono' style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                      {org.slug}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={statusPill(org.status).cls}>{statusPill(org.status).label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {org.subscription?.plan_key || org.plan_key || 'trial'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(renewalDate)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--muted)', textAlign: 'right' }}>
                    {org.memberCount}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(org.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
