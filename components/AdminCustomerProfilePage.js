'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'

export default function AdminCustomerProfilePage({ customerId }) {
  return (
    <AdminAuthGate>
      <AdminCustomerProfileInner customerId={customerId} />
    </AdminAuthGate>
  )
}

function statusLabel(status) {
  return status?.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || '—'
}

function AdminCustomerProfileInner({ customerId }) {
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
          else setError(res.error || 'Failed to load.')
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [customerId])

  if (loading) return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card center-card'>Loading customer…</div>
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
          <div className='kicker'>Customer profile</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {customer.name}
                {customer.is_repeat && (
                  <span className='mini-chip' style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: 12 }}>repeat customer</span>
                )}
              </h1>
              {customer.email && <p style={{ margin: 0 }}>{customer.email}</p>}
              {customer.phone && <p style={{ margin: '4px 0 0', color: '#777' }}>{customer.phone}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href='/admin/customers' className='button button-secondary'>← Customers</Link>
              <AdminSignOutButton />
            </div>
          </div>
        </div>

        <div className='grid-3' style={{ gap: 12 }}>
          <div className='feature-card'>
            <div className='kicker'>Total orders</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{customer.order_count}</div>
            <p style={{ margin: 0 }}>All time</p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>Total paid</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>${Number(customer.total_paid || 0).toFixed(2)}</div>
            <p style={{ margin: 0 }}>Lifetime value</p>
          </div>
          <div className='feature-card'>
            <div className='kicker'>Customer since</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
            <p style={{ margin: 0 }}>{new Date(customer.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className='policy-card'>
          <div className='kicker'>Repair history</div>
          <h3>All orders</h3>

          {orders.length === 0 ? (
            <p style={{ color: '#777', margin: '16px 0 0' }}>No repair orders found.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Device</th>
                    <th>Repair</th>
                    <th>Status</th>
                    <th>Date</th>
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
                        <span className='mini-chip'>{statusLabel(o.current_status)}</span>
                      </td>
                      <td style={{ color: '#777', fontSize: 13 }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {o.quote_id && (
                          <Link
                            href={`/admin/quotes/${o.quote_id}`}
                            className='button button-secondary'
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            View order
                          </Link>
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
