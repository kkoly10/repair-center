'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'

export default function AdminAnalyticsDashboard() {
  return (
    <AdminAuthGate>
      <AdminAnalyticsDashboardInner />
    </AdminAuthGate>
  )
}

function AdminAnalyticsDashboardInner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      try {
        const response = await fetch('/admin/api/analytics')
        if (!response.ok) throw new Error('Failed to load analytics data.')
        const json = await response.json()
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load analytics.')
          setLoading(false)
        }
      }
    }

    fetchAnalytics()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>Loading analytics...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='notice'>{error}</div>
        </div>
      </main>
    )
  }

  const { revenue, funnel, repairs, devicePopularity, repairTypeDemand, recentQuotes, recentPayments } = data

  const conversionRate = funnel.totalQuotes > 0
    ? ((funnel.approved / funnel.totalQuotes) * 100).toFixed(1)
    : '0.0'

  const revenueTrend = revenue.previousPeriodRevenue > 0
    ? (((revenue.currentPeriodRevenue - revenue.previousPeriodRevenue) / revenue.previousPeriodRevenue) * 100).toFixed(1)
    : revenue.currentPeriodRevenue > 0 ? '+100' : '0'

  const trendSign = Number(revenueTrend) >= 0 ? '+' : ''
  const trendColor = Number(revenueTrend) >= 0 ? '#16a34a' : '#ef4444'

  // Funnel steps
  const funnelSteps = [
    { label: 'Submitted', count: funnel.totalQuotes },
    { label: 'Estimate Sent', count: funnel.estimatesSent },
    { label: 'Approved', count: funnel.approved },
    { label: 'Declined', count: funnel.declined },
  ]
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.count), 1)

  // Device popularity
  const maxDeviceCount = devicePopularity.length > 0 ? devicePopularity[0].count : 1

  // Repair type demand
  const maxRepairCount = repairTypeDemand.length > 0 ? repairTypeDemand[0].count : 1
  const totalRepairTypeRequests = repairTypeDemand.reduce((sum, r) => sum + r.count, 0)

  // Revenue breakdown
  const maxRevenuePart = Math.max(revenue.depositRevenue, revenue.balanceRevenue, 1)

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        {/* Header */}
        <div className='info-card'>
          <div className='kicker'>Admin workspace</div>
          <h1>Analytics Dashboard</h1>
          <p className='muted'>Overview of revenue, conversions, repairs, and device trends.</p>
          <div className='inline-actions' style={{ marginTop: 12 }}>
            <Link href='/admin/quotes' className='button button-secondary button-compact'>
              Back to Quotes Dashboard
            </Link>
          </div>
        </div>

        {/* A) Top KPI Cards */}
        <div className='grid-4'>
          <div className='feature-card'>
            <div className='kicker'>Total Revenue</div>
            <h3>{formatCurrency(revenue.totalRevenue)}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              Last 30 days: {formatCurrency(revenue.currentPeriodRevenue)}{' '}
              <span style={{ color: trendColor, fontWeight: 600 }}>
                ({trendSign}{revenueTrend}%)
              </span>
            </p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>Total Quotes</div>
            <h3>{funnel.totalQuotes}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {revenue.totalPayments} payments collected
            </p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>Conversion Rate</div>
            <h3>{conversionRate}%</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {funnel.approved} approved of {funnel.totalQuotes}
            </p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>Active Repairs</div>
            <h3>{repairs.activeRepairs}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {repairs.totalOrders} total orders
            </p>
          </div>
        </div>

        {/* B) Revenue Breakdown */}
        <div className='info-card'>
          <div className='kicker'>Revenue Breakdown</div>
          <h3 style={{ marginBottom: 16 }}>Deposits vs Final Balances</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Inspection Deposits</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatCurrency(revenue.depositRevenue)}</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 6, height: 24, overflow: 'hidden' }}>
                <div style={{
                  width: `${(revenue.depositRevenue / maxRevenuePart) * 100}%`,
                  height: '100%',
                  background: '#2d6bff',
                  borderRadius: 6,
                  minWidth: revenue.depositRevenue > 0 ? 4 : 0,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Final Balances</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatCurrency(revenue.balanceRevenue)}</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 6, height: 24, overflow: 'hidden' }}>
                <div style={{
                  width: `${(revenue.balanceRevenue / maxRevenuePart) * 100}%`,
                  height: '100%',
                  background: '#16a34a',
                  borderRadius: 6,
                  minWidth: revenue.balanceRevenue > 0 ? 4 : 0,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* C) Conversion Funnel */}
        <div className='info-card'>
          <div className='kicker'>Conversion Funnel</div>
          <h3 style={{ marginBottom: 16 }}>Quote Request Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnelSteps.map((step) => {
              const pct = maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0
              const barColor = step.label === 'Declined' ? '#ef4444'
                : step.label === 'Approved' ? '#16a34a'
                : step.label === 'Estimate Sent' ? '#f59e0b'
                : '#2d6bff'

              return (
                <div key={step.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {step.count}
                      {funnel.totalQuotes > 0 && (
                        <span className='muted' style={{ marginLeft: 6, fontWeight: 400, fontSize: '0.82rem' }}>
                          ({((step.count / funnel.totalQuotes) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 6, height: 22, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: 6,
                      minWidth: step.count > 0 ? 4 : 0,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* D) Device Popularity */}
        <div className='info-card'>
          <div className='kicker'>Device Popularity</div>
          <h3 style={{ marginBottom: 16 }}>Top 10 Requested Devices</h3>
          {devicePopularity.length === 0 ? (
            <p className='muted'>No device data available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {devicePopularity.map((item, index) => (
                <div key={item.device}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 700, marginRight: 8, color: 'var(--muted)' }}>#{index + 1}</span>
                      {item.device}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.count}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 5, height: 16, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(item.count / maxDeviceCount) * 100}%`,
                      height: '100%',
                      background: '#2d6bff',
                      borderRadius: 5,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* E) Repair Type Demand */}
        <div className='info-card'>
          <div className='kicker'>Repair Type Demand</div>
          <h3 style={{ marginBottom: 16 }}>Requests by Repair Type</h3>
          {repairTypeDemand.length === 0 ? (
            <p className='muted'>No repair type data available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {repairTypeDemand.map((item) => (
                <div key={item.repairType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatRepairType(item.repairType)}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.count}
                      <span className='muted' style={{ marginLeft: 6, fontWeight: 400, fontSize: '0.82rem' }}>
                        ({((item.count / totalRepairTypeRequests) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 5, height: 16, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(item.count / maxRepairCount) * 100}%`,
                      height: '100%',
                      background: '#f59e0b',
                      borderRadius: 5,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* F) Turnaround Metrics */}
        <div className='grid-4'>
          <div className='feature-card'>
            <div className='kicker'>Avg Turnaround</div>
            <h3>{repairs.avgTurnaroundDays !== null ? `${repairs.avgTurnaroundDays} days` : 'N/A'}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>Intake to completion</p>
          </div>
          {Object.entries(repairs.statusCounts).map(([status, count]) => (
            <div key={status} className='feature-card'>
              <div className='kicker'>{formatStatusLabel(status)}</div>
              <h3>{count}</h3>
              <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>repair orders</p>
            </div>
          ))}
        </div>

        {/* G) Recent Activity */}
        <div className='list-card'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Recent Activity</div>
              <h3>Latest Quote Requests</h3>
            </div>
          </div>
          {recentQuotes.length === 0 ? (
            <p className='muted' style={{ padding: '12px 0' }}>No recent quotes.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>Quote ID</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Device</th>
                    <th style={thStyle}>Repair</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((q) => (
                    <tr key={q.quote_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        <Link href={`/admin/quotes/${q.quote_id}`} style={{ color: '#2d6bff', fontWeight: 600 }}>
                          {q.quote_id}
                        </Link>
                      </td>
                      <td style={tdStyle}>{q.customer}</td>
                      <td style={tdStyle}>{q.device}</td>
                      <td style={tdStyle}>{formatRepairType(q.repair)}</td>
                      <td style={tdStyle}>{formatStatusLabel(q.status)}</td>
                      <td style={tdStyle}>{new Date(q.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className='list-card'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Recent Activity</div>
              <h3>Latest Payments</h3>
            </div>
          </div>
          {recentPayments.length === 0 ? (
            <p className='muted' style={{ padding: '12px 0' }}>No recent payments.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>Payment ID</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{p.id.slice(0, 8)}...</td>
                      <td style={tdStyle}>{formatRepairType(p.kind)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                      <td style={tdStyle}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 700,
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--muted)',
}

const tdStyle = {
  padding: '8px 12px',
}

function formatCurrency(amount) {
  return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatRepairType(key) {
  if (!key || key === 'unknown') return 'Unknown'
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatStatusLabel(status) {
  if (!status) return 'Unknown'
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
