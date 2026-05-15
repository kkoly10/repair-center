'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { statusPill } from '../lib/statusPills'

export default function AdminCustomerProfilePage({ customerId }) {
  return (
    <AdminAuthGate>
      <AdminCustomerProfileInner customerId={customerId} />
    </AdminAuthGate>
  )
}

function AdminCustomerProfileInner({ customerId }) {
  const t = useT()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/admin/api/customers/${customerId}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) {
          if (res.ok) setData(res)
          else setError(res.error || t('adminCustomers.failed'))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [customerId, t])

  if (loading) return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card center-card'>{t('adminCustomers.profileLoading')}</div>
      </div>
    </main>
  )

  if (error) return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='notice notice-error'>{error}</div>
      </div>
    </main>
  )

  const { customer, orders } = data

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        <div className='info-card'>
          <div className='kicker'>{t('adminCustomers.profileKicker')}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {customer.name}
                {customer.is_repeat && (
                  <span className='mini-chip' style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: 12 }}>{t('adminCustomers.repeatCustomerChip')}</span>
                )}
              </h1>
              {customer.email && <p style={{ margin: 0 }}>{customer.email}</p>}
              {customer.phone && <p style={{ margin: '4px 0 0', color: '#777' }}>{customer.phone}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <LocalizedLink href='/admin/customers' className='button button-secondary'>{t('adminCustomers.profileBack')}</LocalizedLink>
              <AdminSignOutButton />
            </div>
          </div>
        </div>

        <div className='grid-3' style={{ gap: 12 }}>
          <div className='feature-card'>
            <div className='kicker'>{t('adminCustomers.statTotalOrders')}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{customer.order_count}</div>
            <p style={{ margin: 0 }}>{t('adminCustomers.statTotalOrdersCaption')}</p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>{t('adminCustomers.statTotalPaid')}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>${Number(customer.total_paid || 0).toFixed(2)}</div>
            <p style={{ margin: 0 }}>{t('adminCustomers.statTotalPaidCaption')}</p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>{t('adminCustomers.statCustomerSince')}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
            <p style={{ margin: 0 }}>{new Date(customer.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className='policy-card'>
          <div className='kicker'>{t('adminCustomers.repairHistoryKicker')}</div>
          <h3>{t('adminCustomers.repairHistoryTitle')}</h3>

          {orders.length === 0 ? (
            <p style={{ color: '#777', margin: '16px 0 0' }}>{t('adminCustomers.noOrders')}</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>{t('adminCustomers.orderHeader')}</th>
                    <th>{t('adminCustomers.deviceHeader')}</th>
                    <th>{t('adminCustomers.repairHeader')}</th>
                    <th>{t('adminCustomers.statusHeader')}</th>
                    <th>{t('adminCustomers.dateHeader')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {o.order_number ? `#${o.order_number}` : o.quote_id || '—'}
                      </td>
                      <td>
                        {[o.brand_name, o.model_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td style={{ color: '#555', fontSize: 13 }}>
                        {o.repair_type_key
                          ? o.repair_type_key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                          : '—'}
                      </td>
                      <td>
                        <span className={statusPill(o.current_status, t).cls}>{statusPill(o.current_status, t).label}</span>
                      </td>
                      <td style={{ color: '#777', fontSize: 13 }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {o.quote_id && (
                          <LocalizedLink
                            href={`/admin/quotes/${o.quote_id}`}
                            className='button button-secondary'
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            {t('adminCustomers.viewOrder')}
                          </LocalizedLink>
                        )}
                      </td>
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
