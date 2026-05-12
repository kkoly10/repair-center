'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'

export default function AdminStaffPerformancePage() {
  return (
    <AdminAuthGate>
      <AdminStaffPerformanceInner />
    </AdminAuthGate>
  )
}

function AdminStaffPerformanceInner() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/admin/api/staff/performance')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.ok) setStats(data.stats || [])
          else setError(data.error || 'Failed to load.')
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [])

  const totalActive = stats.reduce((s, m) => s + m.active_assigned, 0)
  const totalCompleted = stats.reduce((s, m) => s + m.completed_last_30d, 0)

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Admin workspace</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>Staff performance</h1>
              <p>Technician workload, repair throughput, and average turnaround for the last 30 days.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href='/admin/orders' className='button button-secondary'>Repair queue</Link>
              <Link href='/admin/team' className='button button-secondary'>Team</Link>
              <AdminSignOutButton />
            </div>
          </div>
        </div>

        {!loading && !error && stats.length > 0 ? (
          <div className='grid-3' style={{ gap: 12 }}>
            <div className='feature-card'>
              <div className='kicker'>Active</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{totalActive}</div>
              <p style={{ margin: 0 }}>Orders in progress</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>Last 30 days</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{totalCompleted}</div>
              <p style={{ margin: 0 }}>Orders completed</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>Team size</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.length}</div>
              <p style={{ margin: 0 }}>Active staff members</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className='policy-card center-card'>Loading staff performance…</div>
        ) : error ? (
          <div className='notice notice-error'>{error}</div>
        ) : !stats.length ? (
          <div className='policy-card center-card'>No active staff members found.</div>
        ) : (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Active orders</th>
                  <th>Total assigned</th>
                  <th>Completed (30d)</th>
                  <th>Avg turnaround</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.map((member) => (
                  <tr key={member.user_id}>
                    <td style={{ fontWeight: 600 }}>{member.full_name}</td>
                    <td>
                      <span className='mini-chip'>{member.role}</span>
                    </td>
                    <td>
                      <strong>{member.active_assigned}</strong>
                    </td>
                    <td>{member.total_assigned}</td>
                    <td>{member.completed_last_30d}</td>
                    <td>
                      {member.avg_turnaround_days !== null
                        ? `${member.avg_turnaround_days}d`
                        : '—'}
                    </td>
                    <td>
                      <Link
                        href={`/admin/orders?tech=${member.user_id}&status=active`}
                        className='button button-secondary'
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        View queue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
