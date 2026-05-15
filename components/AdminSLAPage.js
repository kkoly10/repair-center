'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT, useLocale } from '../lib/i18n/TranslationProvider'

export default function AdminSLAPage() {
  return (
    <AdminAuthGate>
      <AdminSLAInner />
    </AdminAuthGate>
  )
}

function AdminSLAInner() {
  const t = useT()
  const locale = useLocale()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/admin/api/sla')
      .then((r) => r.json())
      .then((json) => {
        if (json.overdueOrders) setData(json)
        else setError(json.error || t('adminSla.errorLoad'))
      })
      .catch(() => setError(t('adminSla.errorLoad')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) return <main className='page-hero'><div className='site-shell'><p>{t('adminSla.loading')}</p></div></main>
  if (error) return <main className='page-hero'><div className='site-shell'><p className='notice-error'>{error}</p></div></main>

  const { slaCompliance, overdueOrders, stuckOrders, averageTurnaround } = data
  const complianceColor = slaCompliance.percentage >= 90 ? 'var(--success, #16a34a)'
    : slaCompliance.percentage >= 70 ? 'var(--warn, #d97706)'
    : 'var(--danger, #dc2626)'

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('adminSla.kicker')}</div>
          <h1>{t('adminSla.title')}</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: '0.9rem' }}>
            {t('adminSla.lastUpdated', { datetime: new Date(data.generatedAt).toLocaleString(locale) })}
          </p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <div className='policy-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: complianceColor }}>
              {slaCompliance.percentage}%
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>{t('adminSla.slaCompliance')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
              {t('adminSla.onTimeCount', { onTime: slaCompliance.onTimeOrders, total: slaCompliance.totalCompletedOrders })}
            </div>
          </div>

          <div className='policy-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: overdueOrders.count > 0 ? 'var(--danger, #dc2626)' : 'var(--success, #16a34a)' }}>
              {overdueOrders.count}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>{t('adminSla.overdueOrders')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>{t('adminSla.overdueSubtitle')}</div>
          </div>

          <div className='policy-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: stuckOrders.count > 0 ? 'var(--warn, #d97706)' : 'var(--success, #16a34a)' }}>
              {stuckOrders.count}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>{t('adminSla.stuckOrders')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>{t('adminSla.stuckSubtitle')}</div>
          </div>
        </div>

        {/* Overdue orders */}
        {overdueOrders.count > 0 && (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--danger, #dc2626)' }}>
                {t('adminSla.overdueOrdersWithCount', { count: overdueOrders.count })}
              </h2>
            </div>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>{t('adminSla.colOrder')}</th>
                  <th>{t('adminSla.colRepairType')}</th>
                  <th>{t('adminSla.colStatus')}</th>
                  <th>{t('adminSla.colExpectedBy')}</th>
                  <th>{t('adminSla.colOverdue')}</th>
                </tr>
              </thead>
              <tbody>
                {overdueOrders.orders.map((o) => (
                  <tr key={o.orderId}>
                    <td>
                      <LocalizedLink href={`/admin/orders?search=${o.orderNumber}`} style={{ fontWeight: 600 }}>
                        #{o.orderNumber}
                      </LocalizedLink>
                    </td>
                    <td>{o.repairType}</td>
                    <td><span className='chip'>{o.currentStatus?.replace(/_/g, ' ')}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(o.expectedCompletionDate).toLocaleDateString(locale)}
                    </td>
                    <td>
                      <span className='chip chip-error' style={{ fontWeight: 600 }}>
                        {t('adminSla.overdueDays', { days: o.overdueDays })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stuck orders */}
        {stuckOrders.count > 0 && (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--warn, #d97706)' }}>
                {t('adminSla.stuckOrdersWithCount', { count: stuckOrders.count })}
              </h2>
            </div>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>{t('adminSla.colOrder')}</th>
                  <th>{t('adminSla.colRepairType')}</th>
                  <th>{t('adminSla.colStatus')}</th>
                  <th>{t('adminSla.colLastUpdated')}</th>
                  <th>{t('adminSla.colHoursInStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {stuckOrders.orders.map((o) => (
                  <tr key={o.orderId}>
                    <td>
                      <LocalizedLink href={`/admin/orders?search=${o.orderNumber}`} style={{ fontWeight: 600 }}>
                        #{o.orderNumber}
                      </LocalizedLink>
                    </td>
                    <td>{o.repairType}</td>
                    <td><span className='chip'>{o.currentStatus?.replace(/_/g, ' ')}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(o.lastUpdated).toLocaleString(locale)}
                    </td>
                    <td>
                      <span className='chip chip-warn'>{t('adminSla.hoursValue', { hours: o.hoursInStatus })}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {overdueOrders.count === 0 && stuckOrders.count === 0 && (
          <div className='policy-card center-card' style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
            <p style={{ margin: 0, fontWeight: 600 }}>{t('adminSla.allOnTrack')}</p>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{t('adminSla.allOnTrackSubtitle')}</p>
          </div>
        )}

        {/* Average turnaround by repair type */}
        {averageTurnaround.length > 0 && (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>{t('adminSla.avgTurnaroundTitle')}</h2>
            </div>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>{t('adminSla.colRepairType')}</th>
                  <th>{t('adminSla.colAvgDays')}</th>
                  <th>{t('adminSla.colCompletedOrders')}</th>
                </tr>
              </thead>
              <tbody>
                {averageTurnaround
                  .sort((a, b) => a.averageDays - b.averageDays)
                  .map((row) => (
                    <tr key={row.repairKey}>
                      <td>{row.repairName}</td>
                      <td style={{ fontWeight: 600 }}>{t('adminSla.daysValue', { days: row.averageDays })}</td>
                      <td style={{ color: 'var(--muted)' }}>{row.completedOrders}</td>
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
