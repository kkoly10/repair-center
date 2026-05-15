'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminCustomersPage() {
  return (
    <AdminAuthGate>
      <AdminCustomersInner />
    </AdminAuthGate>
  )
}

function AdminCustomersInner() {
  const t = useT()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/admin/api/customers')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.ok) setCustomers(data.customers || [])
          else setError(data.error || t('adminCustomers.failed'))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [t])

  const filtered = search.trim()
    ? customers.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
        )
      })
    : customers

  const repeatCount = customers.filter((c) => c.is_repeat).length

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('adminCustomers.kicker')}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>{t('adminCustomers.title')}</h1>
              <p>{t('adminCustomers.subtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href='/admin/api/export/customers' className='button button-secondary' download>{t('adminCustomers.exportCsv')}</a>
              <LocalizedLink href='/admin/orders' className='button button-secondary'>{t('adminCustomers.repairQueue')}</LocalizedLink>
              <AdminSignOutButton />
            </div>
          </div>
        </div>

        {!loading && !error && customers.length > 0 ? (
          <div className='grid-3' style={{ gap: 12 }}>
            <div className='feature-card'>
              <div className='kicker'>{t('adminCustomers.statTotal')}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{customers.length}</div>
              <p style={{ margin: 0 }}>{t('adminCustomers.statTotalCaption')}</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>{t('adminCustomers.statRepeat')}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{repeatCount}</div>
              <p style={{ margin: 0 }}>{t('adminCustomers.statRepeatCaption')}</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>{t('adminCustomers.statRetention')}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0}%
              </div>
              <p style={{ margin: 0 }}>{t('adminCustomers.statRetentionCaption')}</p>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type='text'
            className='input'
            placeholder={t('adminCustomers.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        {loading ? (
          <div className='policy-card center-card'>{t('adminCustomers.loading')}</div>
        ) : error ? (
          <div className='notice notice-error'>{error}</div>
        ) : !customers.length ? (
          <div className='policy-card center-card'>
            {t('adminCustomers.emptyState')}
          </div>
        ) : !filtered.length ? (
          <div className='policy-card center-card'>{t('adminCustomers.noMatch')}</div>
        ) : (
          <div className='policy-card data-table-stack' style={{ padding: 0 }}>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>{t('adminCustomers.nameHeader')}</th>
                  <th>{t('adminCustomers.emailHeader')}</th>
                  <th>{t('adminCustomers.ordersHeader')}</th>
                  <th>{t('adminCustomers.completedHeader')}</th>
                  <th>{t('adminCustomers.lastOrderHeader')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td data-label={t('adminCustomers.nameHeader')} style={{ fontWeight: 600 }}>
                      {c.name}
                      {c.is_repeat && (
                        <span className='mini-chip' style={{ marginLeft: 6, background: '#dbeafe', color: '#1d4ed8' }}>{t('adminCustomers.repeatChip')}</span>
                      )}
                    </td>
                    <td data-label={t('adminCustomers.emailHeader')} style={{ color: '#555' }}>{c.email || '—'}</td>
                    <td data-label={t('adminCustomers.ordersHeader')}><strong>{c.order_count}</strong></td>
                    <td data-label={t('adminCustomers.completedHeader')}>{c.completed_count}</td>
                    <td data-label={t('adminCustomers.lastOrderHeader')} style={{ color: '#777', fontSize: 13 }}>
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '—'}
                    </td>
                    <td data-label="">
                      <LocalizedLink
                        href={`/admin/customers/${c.id}`}
                        className='button button-secondary'
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        {t('adminCustomers.view')}
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
