'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'

export default function AdminCustomersPage() {
  return (
    <AdminAuthGate>
      <AdminCustomersInner />
    </AdminAuthGate>
  )
}

function AdminCustomersInner() {
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
          else setError(data.error || 'Failed to load.')
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [])

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
          <div className='kicker'>Admin workspace</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>Customers</h1>
              <p>All customers who have submitted a repair request.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href='/admin/api/export/customers' className='button button-secondary' download>Export CSV</a>
              <Link href='/admin/orders' className='button button-secondary'>Repair queue</Link>
              <AdminSignOutButton />
            </div>
          </div>
        </div>

        {!loading && !error && customers.length > 0 ? (
          <div className='grid-3' style={{ gap: 12 }}>
            <div className='feature-card'>
              <div className='kicker'>Total</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{customers.length}</div>
              <p style={{ margin: 0 }}>Customers</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>Repeat</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{repeatCount}</div>
              <p style={{ margin: 0 }}>Returning customers</p>
            </div>
            <div className='feature-card'>
              <div className='kicker'>Retention</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0}%
              </div>
              <p style={{ margin: 0 }}>Repeat rate</p>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type='text'
            className='input'
            placeholder='Search by name, email, or phone…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        {loading ? (
          <div className='policy-card center-card'>Loading customers…</div>
        ) : error ? (
          <div className='notice notice-error'>{error}</div>
        ) : !customers.length ? (
          <div className='policy-card center-card'>No customers yet.</div>
        ) : !filtered.length ? (
          <div className='policy-card center-card'>No customers match your search.</div>
        ) : (
          <div className='policy-card' style={{ padding: 0, overflowX: 'auto' }}>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Completed</th>
                  <th>Last order</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>
                      {c.name}
                      {c.is_repeat && (
                        <span className='mini-chip' style={{ marginLeft: 6, background: '#dbeafe', color: '#1d4ed8' }}>repeat</span>
                      )}
                    </td>
                    <td style={{ color: '#555' }}>{c.email || '—'}</td>
                    <td><strong>{c.order_count}</strong></td>
                    <td>{c.completed_count}</td>
                    <td style={{ color: '#777', fontSize: 13 }}>
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className='button button-secondary'
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        View
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
