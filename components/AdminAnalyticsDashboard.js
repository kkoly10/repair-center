'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT, useLocale } from '../lib/i18n/TranslationProvider'

export default function AdminAnalyticsDashboard() {
  return (
    <AdminAuthGate>
      <AdminAnalyticsDashboardInner />
    </AdminAuthGate>
  )
}

function AdminAnalyticsDashboardInner() {
  const t = useT()
  const locale = useLocale()
  const [range, setRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const RANGE_OPTIONS = [
    { value: '7d', label: t('adminAnalytics.range7d') },
    { value: '30d', label: t('adminAnalytics.range30d') },
    { value: '90d', label: t('adminAnalytics.range90d') },
    { value: '12m', label: t('adminAnalytics.range12m') },
    { value: 'all', label: t('adminAnalytics.rangeAll') },
  ]

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/admin/api/analytics?range=${range}`)
        if (!response.ok) throw new Error(t('adminAnalytics.errorLoad'))
        const json = await response.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err.message || t('adminAnalytics.errorLoad'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [range, t])

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
            <div className='kicker'>{t('adminAnalytics.kicker')}</div>
            <h1>{t('adminAnalytics.title')}</h1>
            {rangeSelector}
          </div>
          <div className='policy-card'>{t('adminAnalytics.loading')}</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='info-card'>
            <div className='kicker'>{t('adminAnalytics.kicker')}</div>
            <h1>{t('adminAnalytics.title')}</h1>
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
    : revenue.total > 0 ? '100' : '0'

  const trendSign = Number(revenueTrend) >= 0 ? '+' : ''
  const trendColor = Number(revenueTrend) >= 0 ? '#16a34a' : '#ef4444'

  const quoteTrend = funnel.prevTotalQuotes > 0
    ? (((funnel.totalQuotes - funnel.prevTotalQuotes) / funnel.prevTotalQuotes) * 100).toFixed(1)
    : funnel.totalQuotes > 0 ? '100' : '0'
  const quoteTrendSign = Number(quoteTrend) >= 0 ? '+' : ''
  const quoteTrendColor = Number(quoteTrend) >= 0 ? '#16a34a' : '#ef4444'

  // prevConversionRate omitted — prev period approved count not available in response

  const funnelSteps = [
    { key: 'submitted', label: t('adminAnalytics.funnelSubmitted'), count: funnel.totalQuotes },
    { key: 'estimateSent', label: t('adminAnalytics.funnelEstimateSent'), count: funnel.estimatesSent },
    { key: 'approved', label: t('adminAnalytics.funnelApproved'), count: funnel.approved },
    { key: 'declined', label: t('adminAnalytics.funnelDeclined'), count: funnel.declined },
  ]
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.count), 1)
  const maxDeviceCount = devicePopularity.length > 0 ? devicePopularity[0].count : 1
  const maxRepairCount = repairTypeDemand.length > 0 ? repairTypeDemand[0].count : 1
  const totalRepairTypeRequests = repairTypeDemand.reduce((s, r) => s + r.count, 0)
  const maxRevenueByType = revenueByType.length > 0 ? revenueByType[0].amount : 1
  const maxRevenueByTech = revenueByTech.length > 0 ? revenueByTech[0].amount : 1

  const rangeLabel = RANGE_OPTIONS.find(o => o.value === range)?.label

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        {/* Header */}
        <div className='info-card'>
          <div className='kicker'>{t('adminAnalytics.kicker')}</div>
          <h1>{t('adminAnalytics.title')}</h1>
          <p className='muted'>{t('adminAnalytics.subtitle')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {rangeSelector}
            <LocalizedLink href='/admin/quotes' className='button button-secondary button-compact'>
              {t('adminAnalytics.backToQuotes')}
            </LocalizedLink>
          </div>
        </div>

        {/* A) KPI Cards */}
        <div className='grid-4'>
          <div className='feature-card'>
            <div className='kicker'>{t('adminAnalytics.kpiRevenue', { range: rangeLabel })}</div>
            <h3>{fmt(revenue.total)}</h3>
            {revenue.prev > 0 && (
              <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
                {t('adminAnalytics.vsPrevPeriod')}{' '}
                <span style={{ color: trendColor, fontWeight: 600 }}>
                  {trendSign}{revenueTrend}%
                </span>
              </p>
            )}
          </div>
          <div className='feature-card'>
            <div className='kicker'>{t('adminAnalytics.kpiTotalQuotes')}</div>
            <h3>{funnel.totalQuotes}</h3>
            {funnel.prevTotalQuotes > 0 && (
              <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
                {t('adminAnalytics.vsPrevPeriod')}{' '}
                <span style={{ color: quoteTrendColor, fontWeight: 600 }}>
                  {quoteTrendSign}{quoteTrend}%
                </span>
              </p>
            )}
            {!funnel.prevTotalQuotes && (
              <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
                {t('adminAnalytics.nApproved', { count: funnel.approved })}
              </p>
            )}
          </div>
          <div className='feature-card'>
            <div className='kicker'>{t('adminAnalytics.kpiConversionRate')}</div>
            <h3>{conversionRate}%</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {t('adminAnalytics.nApproved', { count: funnel.approved })}
            </p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>{t('adminAnalytics.kpiRepeatRate')}</div>
            <h3>{customers.repeatRate}%</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {t('adminAnalytics.repeatOfTotal', { repeat: customers.repeatCustomers, total: customers.total })}
            </p>
          </div>
        </div>

        {/* B) Revenue Breakdown (deposits vs balances + collection rates) */}
        <div className='info-card'>
          <div className='kicker'>{t('adminAnalytics.revenueBreakdownKicker')}</div>
          <h3 style={{ marginBottom: 16 }}>{t('adminAnalytics.revenueBreakdownTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: t('adminAnalytics.depositsLabel'), amount: revenue.deposits, color: '#2d6bff' },
              { label: t('adminAnalytics.balancesLabel'), amount: revenue.balances, color: '#16a34a' },
            ].map(({ label, amount, color }) => {
              const maxAmt = Math.max(revenue.deposits, revenue.balances, 1)
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {fmt(amount)}
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
            <div className='kicker'>{t('adminAnalytics.revenueByTypeKicker')}</div>
            <h3 style={{ marginBottom: 16 }}>{t('adminAnalytics.revenueByTypeTitle')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {revenueByType.map((item) => (
                <div key={item.repairType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fmtKey(item.repairType, t)}</span>
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
            <div className='kicker'>{t('adminAnalytics.revenueByTechKicker')}</div>
            <h3 style={{ marginBottom: 16 }}>{t('adminAnalytics.revenueByTechTitle')}</h3>
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
          <div className='kicker'>{t('adminAnalytics.funnelKicker')}</div>
          <h3 style={{ marginBottom: 16 }}>{t('adminAnalytics.funnelTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnelSteps.map((step) => {
              const pct = maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0
              const color = step.key === 'declined' ? '#ef4444'
                : step.key === 'approved' ? '#16a34a'
                : step.key === 'estimateSent' ? '#f59e0b'
                : '#2d6bff'

              return (
                <div key={step.key}>
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
          <div className='kicker'>{t('adminAnalytics.repairDemandKicker')}</div>
          <h3 style={{ marginBottom: 16 }}>{t('adminAnalytics.repairDemandTitle')}</h3>
          {repairTypeDemand.length === 0 ? (
            <p className='muted'>{t('adminAnalytics.noRepairData')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {repairTypeDemand.map((item) => (
                <div key={item.repairType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fmtKey(item.repairType, t)}</span>
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
          <div className='kicker'>{t('adminAnalytics.devicePopularityKicker')}</div>
          <h3 style={{ marginBottom: 16 }}>{t('adminAnalytics.devicePopularityTitle')}</h3>
          {devicePopularity.length === 0 ? (
            <p className='muted'>{t('adminAnalytics.noDeviceData')}</p>
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
            <div className='kicker'>{t('adminAnalytics.activeRepairs')}</div>
            <h3>{repairs.activeRepairs}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {t('adminAnalytics.totalOrders', { count: repairs.totalOrders })}
            </p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>{t('adminAnalytics.avgTurnaround')}</div>
            <h3>{repairs.avgTurnaroundDays !== null ? t('adminAnalytics.nDays', { days: repairs.avgTurnaroundDays }) : t('adminAnalytics.notAvailable')}</h3>
            <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>{t('adminAnalytics.intakeToShipped')}</p>
          </div>
          {Object.entries(repairs.statusCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([status, count]) => (
              <div key={status} className='feature-card'>
                <div className='kicker'>{fmtKey(status, t)}</div>
                <h3>{count}</h3>
                <p className='muted' style={{ fontSize: '0.85rem', marginTop: 4 }}>{t('adminAnalytics.repairOrdersLabel')}</p>
              </div>
            ))}
        </div>

        {/* I) Recent Quotes */}
        <div className='list-card'>
          <div className='section-head'>
            <div>
              <div className='kicker'>{t('adminAnalytics.recentActivityKicker')}</div>
              <h3>{t('adminAnalytics.recentQuotesTitle')}</h3>
            </div>
          </div>
          {recentQuotes.length === 0 ? (
            <p className='muted' style={{ padding: '12px 0' }}>{t('adminAnalytics.noRecentQuotes')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                      t('adminAnalytics.tableQuoteId'),
                      t('adminAnalytics.tableCustomer'),
                      t('adminAnalytics.tableDevice'),
                      t('adminAnalytics.tableRepair'),
                      t('adminAnalytics.tableStatus'),
                      t('adminAnalytics.tableDate'),
                    ].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((q) => (
                    <tr key={q.quote_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        <LocalizedLink href={`/admin/quotes/${q.quote_id}`} style={{ color: '#2d6bff', fontWeight: 600 }}>
                          {q.quote_id}
                        </LocalizedLink>
                      </td>
                      <td style={tdStyle}>{q.customer}</td>
                      <td style={tdStyle}>{q.device}</td>
                      <td style={tdStyle}>{fmtKey(q.repair, t)}</td>
                      <td style={tdStyle}>{fmtKey(q.status, t)}</td>
                      <td style={tdStyle}>{new Date(q.created_at).toLocaleDateString(locale)}</td>
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

function fmtKey(key, t) {
  if (!key || key === 'N/A') return key || (t ? t('adminAnalytics.unknown') : 'Unknown')
  if (key === 'unknown') return t ? t('adminAnalytics.unknown') : 'Unknown'
  // Try status translation first
  if (t) {
    const statusTranslation = t(`status.${key}`)
    if (statusTranslation && statusTranslation !== `status.${key}`) return statusTranslation
  }
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
