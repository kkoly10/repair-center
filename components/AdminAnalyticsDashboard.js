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

const RANGE_OPTIONS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
  { value: 'all', label: 'All time' },
]

function AdminAnalyticsDashboardInner() {
  const [range, setRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/admin/api/analytics?range=${range}`)
        if (!response.ok) throw new Error('Failed to load analytics data.')
        const json = await response.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load analytics.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [range])

  const rangeSelector = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setRange(opt.value)}
          className={range === opt.value ? 'button button-compact' : 'button button-secondary button-compact'}
          style={{ minWidth: 80 }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='info-card'>
            <div className='kicker'>Admin workspace</div>
            <h1>Analytics Dashboard</h1>
            {rangeSelector}
          </div>
          <div className='policy-card'>Loading analytics...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='info-card'>
            <div className='kicker'>Admin workspace</div>
            <h1>Analytics Dashboard</h1>
            {rangeSelector}
          </div>
          <div className='notice'>{error}</div>
        </div>
      </main>
    )
  }

  const { revenue, revenueByType, revenueByTech, funnel, repairs, devicePopularity, repairTypeDemand, recentQuotes, customers } = data

  const conversionRate = funnel.totalQuotes > 0
    ? ((funnel.approved / funnel.totalQuotes) * 100).toFixed(1)
    : '0.0'

  const revenueTrend = revenue.prev > 0
    ? (((revenue.total - revenue.prev) / revenue.prev) * 100).toFixed(1)
    : revenue.total > 0 ? '+100' : '0'

  const trendSign = Number(revenueTrend) >= 0 ? '+' : ''
  const trendColor = Number(revenueTrend) >= 0 ? '#16a34a' : '#ef4444'

  const funnelSteps = [
    { label: 'Submitted', count: funnel.totalQuotes },
    { label: 'Estimate Sent', count: funnel.estimatesSent },
    { label: 'Approved', count: funnel.approved },
    { label: 'Declined', count: funnel.declined },
  ]
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.count), 1)
  const maxDeviceCount = devicePopularity.length > 0 ? devicePopularity[0].count : 1
  const maxRepairCount = repairTypeDemand.length > 0 ? repairTypeDemand[0].count : 1
  const totalRepairTypeRequests = repairTypeDemand.reduce((s, r) => s + r.count, 0)
  const maxRevenueByType = revenueByType.length > 0 ? revenueByType[0].amount : 1
  const maxRevenueByTech = revenueByTech.length > 0 ? revenueByTech[0].amount : 1

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        {/* Header */}
        <div className='info-card'>
          <div className='kicker'>Admin workspace</div>
          <h1>Analytics Dashboard</h1>
          <p className='muted'>Revenue, conversions, repairs, and device trends.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {rangeSelector}
            <Link href='/admin/quotes' className='button button-secondary button-compact'>
              Back to Quotes
            </Link>
          </div>
        </div>

        {/* A) KPI Cards */}
        <div className='grid-4'>
          <div className='feature-card'>
            <div className='kicker'>Revenue ({RANGE_OPTIONS.find(o => o.value === range)?.label})</div>
            <h3>{fmt(revenue.total)}</h3>
            {revenue.prev > 0 && (
              <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
                vs prev period{' '}
                <span style={{ color: trendColor, fontWeight: 600 }}>
                  {trendSign}{revenueTrend}%
                </span>
              </p>
            )}
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
            <div className='kicker'>Repeat Customer Rate</div>
            <h3>{customers.repeatRate}%</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {customers.repeatCustomers} of {customers.total} customers
            </p>
          </div>
        </div>

        {/* B) Revenue Breakdown (deposits vs balances + collection rates) */}
        <div className='info-card'>
          <div className='kicker'>Revenue Breakdown</div>
          <h3 style={{ marginBottom: 16 }}>Deposits vs Final Balances</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Inspection Deposits', amount: revenue.deposits, rate: revenue.depositRate, color: '#2d6bff' },
              { label: 'Final Balances', amount: revenue.balances, rate: revenue.balanceRate, color: '#16a34a' },
            ].map(({ label, amount, rate, color }) => {
              const maxAmt = Math.max(revenue.deposits, revenue.balances, 1)
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {fmt(amount)}
                      <span className='muted' style={{ fontWeight: 400, fontSize: '0.82rem', marginLeft: 8 }}>
                        ({rate}% of orders)
                      </span>
                    </span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 6, height: 24, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(amount / maxAmt) * 100}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 6,
                      minWidth: amount > 0 ? 4 : 0,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* C) Revenue by Repair Type */}
        {revenueByType.length > 0 && (
          <div className='info-card'>
            <div className='kicker'>Revenue by Repair Type</div>
            <h3 style={{ marginBottom: 16 }}>Top repair categories by revenue</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {revenueByType.map((item) => (
                <div key={item.repairType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fmtKey(item.repairType)}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fmt(item.amount)}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 5, height: 18, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(item.amount / maxRevenueByType) * 100}%`,
                      height: '100%',
                      background: '#7c3aed',
                      borderRadius: 5,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* D) Revenue by Technician */}
        {revenueByTech.length > 0 && (
          <div className='info-card'>
            <div className='kicker'>Revenue by Technician</div>
            <h3 style={{ marginBottom: 16 }}>Completed repair revenue per tech</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {revenueByTech.map((item) => (
                <div key={item.tech}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.tech}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fmt(item.amount)}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 5, height: 18, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(item.amount / maxRevenueByTech) * 100}%`,
                      height: '100%',
                      background: '#0891b2',
                      borderRadius: 5,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E) Conversion Funnel */}
        <div className='info-card'>
          <div className='kicker'>Conversion Funnel</div>
          <h3 style={{ marginBottom: 16 }}>Quote Request Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnelSteps.map((step) => {
              const pct = maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0
              const color = step.label === 'Declined' ? '#ef4444'
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
                      background: color,
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

        {/* F) Repair Type Demand (quote volume) */}
        <div className='info-card'>
          <div className='kicker'>Repair Type Demand</div>
          <h3 style={{ marginBottom: 16 }}>Quote volume by repair type</h3>
          {repairTypeDemand.length === 0 ? (
            <p className='muted'>No repair type data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {repairTypeDemand.map((item) => (
                <div key={item.repairType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fmtKey(item.repairType)}</span>
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

        {/* G) Device Popularity */}
        <div className='info-card'>
          <div className='kicker'>Device Popularity</div>
          <h3 style={{ marginBottom: 16 }}>Top 10 requested devices</h3>
          {devicePopularity.length === 0 ? (
            <p className='muted'>No device data yet.</p>
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

        {/* H) Repair Metrics */}
        <div className='grid-4'>
          <div className='feature-card'>
            <div className='kicker'>Active Repairs</div>
            <h3>{repairs.activeRepairs}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>{repairs.totalOrders} total orders</p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>Avg Turnaround</div>
            <h3>{repairs.avgTurnaroundDays !== null ? `${repairs.avgTurnaroundDays}d` : 'N/A'}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>Intake to shipped</p>
          </div>
          {Object.entries(repairs.statusCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([status, count]) => (
              <div key={status} className='feature-card'>
                <div className='kicker'>{fmtKey(status)}</div>
                <h3>{count}</h3>
                <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>repair orders</p>
              </div>
            ))}
        </div>

        {/* I) Recent Quotes */}
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
                    {['Quote ID', 'Customer', 'Device', 'Repair', 'Status', 'Date'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
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
                      <td style={tdStyle}>{fmtKey(q.repair)}</td>
                      <td style={tdStyle}>{fmtKey(q.status)}</td>
                      <td style={tdStyle}>{new Date(q.created_at).toLocaleDateString()}</td>
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

function fmt(amount) {
  return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtKey(key) {
  if (!key || key === 'unknown' || key === 'N/A') return key || 'Unknown'
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
