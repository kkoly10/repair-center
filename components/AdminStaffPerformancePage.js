'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminStaffPerformancePage() {
  return (
    <AdminAuthGate>
      <AdminStaffPerformanceInner />
    </AdminAuthGate>
  )
}

function AdminStaffPerformanceInner() {
  const t = useT()
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
          else setError(data.error || t('adminStaff.errorLoad'))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [t])

  const totalActive = stats.reduce((s, m) => s + m.active_assigned, 0)
  const totalCompleted = stats.reduce((s, m) => s + m.completed_last_30d, 0)

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('adminStaff.kicker')}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>{t('adminStaff.title')}</h1>
              <p>{t('adminStaff.subtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <LocalizedLink href='/admin/orders' className='button button-secondary'>{t('adminStaff.repairQueue')}</LocalizedLink>
              <LocalizedLink href='/admin/team' className='button button-secondary'>{t('adminStaff.team')}</LocalizedLink>
              <AdminSignOutButton />
            </div>
          </div>
        </div>

        {!loading && !error && stats.length > 0 ? (
          <div className='grid-3' style={{ gap: 12 }}>
            <div className='feature-card'>
              <div className='kicker'>{t('adminStaff.activeKicker')}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{totalActive}</div>
              <p style={{ margin: 0 }}>{t('adminStaff.ordersInProgress')}</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>{t('adminStaff.last30dKicker')}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{totalCompleted}</div>
              <p style={{ margin: 0 }}>{t('adminStaff.ordersCompleted')}</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>{t('adminStaff.teamSizeKicker')}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.length}</div>
              <p style={{ margin: 0 }}>{t('adminStaff.activeStaffMembers')}</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className='policy-card center-card'>{t('adminStaff.loading')}</div>
        ) : error ? (
          <div className='notice notice-error'>{error}</div>
        ) : !stats.length ? (
          <div className='policy-card center-card'>{t('adminStaff.noStaff')}</div>
        ) : (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>{t('adminStaff.colName')}</th>
                  <th>{t('adminStaff.colRole')}</th>
                  <th>{t('adminStaff.colActiveOrders')}</th>
                  <th>{t('adminStaff.colTotalAssigned')}</th>
                  <th>{t('adminStaff.colCompleted30d')}</th>
                  <th>{t('adminStaff.colAvgTurnaround')}</th>
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
                        ? t('adminStaff.daysValue', { days: member.avg_turnaround_days })
                        : '—'}
                    </td>
                    <td>
                      <LocalizedLink
                        href={`/admin/orders?tech=${member.user_id}&status=active`}
                        className='button button-secondary'
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        {t('adminStaff.viewQueue')}
                      </LocalizedLink>
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
