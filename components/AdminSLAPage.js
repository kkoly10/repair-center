'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'

export default function AdminSLAPage() {
  return (
    <AdminAuthGate>
      <AdminSLAInner />
    </AdminAuthGate>
  )
}

function AdminSLAInner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/admin/api/sla')
      .then((r) => r.json())
      .then((json) => {
        if (json.overdueOrders) setData(json)
        else setError(json.error || 'Failed to load SLA data.')
      })
      .catch(() => setError('Failed to load SLA data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className='page-hero'><div className='site-shell'><p>Loading SLA data…</p></div></main>
  if (error) return <main className='page-hero'><div className='site-shell'><p className='notice-error'>{error}</p></div></main>

  const { slaCompliance, overdueOrders, stuckOrders, averageTurnaround } = data
  const complianceColor = slaCompliance.percentage >= 90 ? 'var(--success, #16a34a)'
    : slaCompliance.percentage >= 70 ? 'var(--warn, #d97706)'
    : 'var(--danger, #dc2626)'

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Operations</div>
          <h1>SLA &amp; Turnaround</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: '0.9rem' }}>
            Last updated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <div className='policy-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: complianceColor }}>
              {slaCompliance.percentage}%
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>SLA Compliance</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
              {slaCompliance.onTimeOrders}/{slaCompliance.totalCompletedOrders} on time
            </div>
          </div>

          <div className='policy-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: overdueOrders.count > 0 ? 'var(--danger, #dc2626)' : 'var(--success, #16a34a)' }}>
              {overdueOrders.count}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>Overdue Orders</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>past expected completion</div>
          </div>

          <div className='policy-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: stuckOrders.count > 0 ? 'var(--warn, #d97706)' : 'var(--success, #16a34a)' }}>
              {stuckOrders.count}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>Stuck Orders</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>no update in 48h</div>
          </div>
        </div>

        {/* Overdue orders */}
        {overdueOrders.count > 0 && (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--danger, #dc2626)' }}>
                Overdue Orders ({overdueOrders.count})
              </h2>
            </div>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Repair type</th>
                  <th>Status</th>
                  <th>Expected by</th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {overdueOrders.orders.map((o) => (
                  <tr key={o.orderId}>
                    <td>
                      <Link href={`/admin/orders?search=${o.orderNumber}`} style={{ fontWeight: 600 }}>
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td>{o.repairType}</td>
                    <td><span className='chip'>{o.currentStatus?.replace(/_/g, ' ')}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(o.expectedCompletionDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className='chip chip-error' style={{ fontWeight: 600 }}>
                        {o.overdueDays}d overdue
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
                Stuck Orders ({stuckOrders.count})
              </h2>
            </div>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Repair type</th>
                  <th>Status</th>
                  <th>Last updated</th>
                  <th>Hours in status</th>
                </tr>
              </thead>
              <tbody>
                {stuckOrders.orders.map((o) => (
                  <tr key={o.orderId}>
                    <td>
                      <Link href={`/admin/orders?search=${o.orderNumber}`} style={{ fontWeight: 600 }}>
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td>{o.repairType}</td>
                    <td><span className='chip'>{o.currentStatus?.replace(/_/g, ' ')}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(o.lastUpdated).toLocaleString()}
                    </td>
                    <td>
                      <span className='chip chip-warn'>{o.hoursInStatus}h</span>
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
            <p style={{ margin: 0, fontWeight: 600 }}>All repairs on track</p>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>No overdue or stuck orders right now.</p>
          </div>
        )}

        {/* Average turnaround by repair type */}
        {averageTurnaround.length > 0 && (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Avg. Turnaround by Repair Type</h2>
            </div>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Repair type</th>
                  <th>Avg. days</th>
                  <th>Completed orders</th>
                </tr>
              </thead>
              <tbody>
                {averageTurnaround
                  .sort((a, b) => a.averageDays - b.averageDays)
                  .map((t) => (
                    <tr key={t.repairKey}>
                      <td>{t.repairName}</td>
                      <td style={{ fontWeight: 600 }}>{t.averageDays}d</td>
                      <td style={{ color: 'var(--muted)' }}>{t.completedOrders}</td>
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
