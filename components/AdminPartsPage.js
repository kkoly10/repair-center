'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import Link from 'next/link'

export default function AdminPartsPage() {
  return (
    <AdminAuthGate>
      <AdminPartsPageInner />
    </AdminAuthGate>
  )
}

const EMPTY_FORM = { name: '', sku: '', description: '', cost_price: '', quantity_on_hand: '0', low_stock_threshold: '0' }

function AdminPartsPageInner() {
  const [parts, setParts] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [addError, setAddError] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/admin/api/parts')
        if (!res.ok) throw new Error('Failed to load parts.')
        const json = await res.json()
        if (!cancelled) {
          setParts(json.parts || [])
          setLowStockCount(json.lowStockCount || 0)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load parts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const filtered = parts.filter((p) => {
    if (!showInactive && !p.active) return false
    if (showLowStock && !p.is_low_stock) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  async function handleAdd(e) {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    try {
      const res = await fetch('/admin/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          sku: addForm.sku || null,
          description: addForm.description || null,
          cost_price: Number(addForm.cost_price || 0),
          quantity_on_hand: Number(addForm.quantity_on_hand || 0),
          low_stock_threshold: Number(addForm.low_stock_threshold || 0),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create part.')

      // Reload parts
      const reloadRes = await fetch('/admin/api/parts')
      const reloadJson = await reloadRes.json()
      setParts(reloadJson.parts || [])
      setLowStockCount(reloadJson.lowStockCount || 0)
      setAddForm(EMPTY_FORM)
      setShowAddForm(false)
    } catch (err) {
      setAddError(err.message || 'Failed to create part.')
    } finally {
      setAddSaving(false)
    }
  }

  function startEdit(part) {
    setEditingId(part.id)
    setEditForm({
      name: part.name,
      sku: part.sku || '',
      description: part.description || '',
      cost_price: String(part.cost_price),
      quantity_on_hand: String(part.quantity_on_hand),
      low_stock_threshold: String(part.low_stock_threshold),
      active: part.active,
    })
    setEditError('')
  }

  async function handleEdit(partId) {
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/admin/api/parts/${partId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          sku: editForm.sku || null,
          description: editForm.description || null,
          cost_price: Number(editForm.cost_price || 0),
          quantity_on_hand: Number(editForm.quantity_on_hand || 0),
          low_stock_threshold: Number(editForm.low_stock_threshold || 0),
          active: editForm.active,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update part.')

      setParts((prev) => prev.map((p) => p.id !== partId ? p : {
        ...p,
        name: editForm.name,
        sku: editForm.sku || null,
        description: editForm.description || null,
        cost_price: Number(editForm.cost_price || 0),
        quantity_on_hand: Number(editForm.quantity_on_hand || 0),
        low_stock_threshold: Number(editForm.low_stock_threshold || 0),
        is_low_stock: Number(editForm.low_stock_threshold || 0) > 0 && Number(editForm.quantity_on_hand || 0) <= Number(editForm.low_stock_threshold || 0),
        active: editForm.active,
      }))
      setLowStockCount((prev) => {
        const updatedParts = parts.map((p) => p.id !== partId ? p : { ...p, is_low_stock: Number(editForm.low_stock_threshold || 0) > 0 && Number(editForm.quantity_on_hand || 0) <= Number(editForm.low_stock_threshold || 0), active: editForm.active })
        return updatedParts.filter((p) => p.is_low_stock && p.active).length
      })
      setEditingId(null)
    } catch (err) {
      setEditError(err.message || 'Failed to update part.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeactivate(partId) {
    try {
      await fetch(`/admin/api/parts/${partId}`, { method: 'DELETE' })
      setParts((prev) => prev.map((p) => p.id === partId ? { ...p, active: false } : p))
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>Loading parts catalog...</div>
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

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        {/* Header */}
        <div className='info-card'>
          <div className='kicker'>Admin workspace</div>
          <h1>Parts Catalog</h1>
          <p className='muted'>Track parts inventory and costs used in repairs.</p>
          <div className='inline-actions' style={{ marginTop: 12 }}>
            <button className='button button-compact' onClick={() => { setShowAddForm(true); setAddError('') }}>
              + Add Part
            </button>
            <Link href='/admin/quotes' className='button button-secondary button-compact'>
              Back to Quotes
            </Link>
          </div>
        </div>

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <div className='notice-warn'>
            {lowStockCount} part{lowStockCount !== 1 ? 's are' : ' is'} below the low-stock threshold.{' '}
            <button
              className='link-button'
              onClick={() => setShowLowStock((v) => !v)}
              style={{ fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {showLowStock ? 'Show all' : 'Show low stock only'}
            </button>
          </div>
        )}

        {/* Add part form */}
        {showAddForm && (
          <div className='info-card'>
            <h3 style={{ marginBottom: 16 }}>Add New Part</h3>
            <form onSubmit={handleAdd}>
              <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className='label'>Name *</label>
                  <input className='input' value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder='e.g. iPhone 14 Screen' required />
                </div>
                <div>
                  <label className='label'>SKU</label>
                  <input className='input' value={addForm.sku} onChange={(e) => setAddForm((f) => ({ ...f, sku: e.target.value }))} placeholder='e.g. IP14-LCD-OEM' />
                </div>
                <div>
                  <label className='label'>Cost Price ($)</label>
                  <input className='input' type='number' min='0' step='0.01' value={addForm.cost_price} onChange={(e) => setAddForm((f) => ({ ...f, cost_price: e.target.value }))} placeholder='0.00' />
                </div>
                <div>
                  <label className='label'>Qty on Hand</label>
                  <input className='input' type='number' min='0' step='1' value={addForm.quantity_on_hand} onChange={(e) => setAddForm((f) => ({ ...f, quantity_on_hand: e.target.value }))} />
                </div>
                <div>
                  <label className='label'>Low Stock Alert At</label>
                  <input className='input' type='number' min='0' step='1' value={addForm.low_stock_threshold} onChange={(e) => setAddForm((f) => ({ ...f, low_stock_threshold: e.target.value }))} placeholder='0 = disabled' />
                </div>
                <div>
                  <label className='label'>Description</label>
                  <input className='input' value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} placeholder='Optional notes' />
                </div>
              </div>
              {addError && <p className='notice' style={{ marginBottom: 12 }}>{addError}</p>}
              <div className='inline-actions'>
                <button className='button button-compact' type='submit' disabled={addSaving}>{addSaving ? 'Saving…' : 'Add Part'}</button>
                <button className='button button-secondary button-compact' type='button' onClick={() => { setShowAddForm(false); setAddError('') }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className='list-card'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Inventory</div>
              <h3>Parts ({filtered.length})</h3>
            </div>
            <div className='inline-actions'>
              <input
                className='input'
                style={{ width: 200 }}
                placeholder='Search name, SKU…'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type='checkbox' checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Show inactive
              </label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className='muted' style={{ padding: '12px 0' }}>
              {parts.length === 0 ? 'No parts yet. Add your first part above.' : 'No parts match your filters.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name / SKU', 'Cost', 'In Stock', 'Alert At', 'Status', ''].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((part) => (
                    editingId === part.id ? (
                      <tr key={part.id} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle, #fafafa)' }}>
                        <td style={tdStyle} colSpan={6}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 8, alignItems: 'center' }}>
                            <input className='input' value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder='Name *' />
                            <input className='input' value={editForm.sku} onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))} placeholder='SKU' />
                            <input className='input' type='number' min='0' step='0.01' value={editForm.cost_price} onChange={(e) => setEditForm((f) => ({ ...f, cost_price: e.target.value }))} placeholder='Cost $' />
                            <input className='input' type='number' min='0' step='1' value={editForm.quantity_on_hand} onChange={(e) => setEditForm((f) => ({ ...f, quantity_on_hand: e.target.value }))} placeholder='Qty' />
                            <input className='input' type='number' min='0' step='1' value={editForm.low_stock_threshold} onChange={(e) => setEditForm((f) => ({ ...f, low_stock_threshold: e.target.value }))} placeholder='Alert' />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className='button button-compact' style={{ fontSize: '0.8rem' }} onClick={() => handleEdit(part.id)} disabled={editSaving}>
                                {editSaving ? '…' : 'Save'}
                              </button>
                              <button className='button button-secondary button-compact' style={{ fontSize: '0.8rem' }} onClick={() => setEditingId(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                          {editError && <p className='notice' style={{ marginTop: 8, marginBottom: 0 }}>{editError}</p>}
                        </td>
                      </tr>
                    ) : (
                      <tr key={part.id} style={{ borderBottom: '1px solid var(--border)', opacity: part.active ? 1 : 0.5 }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600 }}>{part.name}</span>
                          {part.sku && <span className='muted' style={{ fontSize: '0.8rem', marginLeft: 6 }}>{part.sku}</span>}
                        </td>
                        <td style={tdStyle}>${Number(part.cost_price).toFixed(2)}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: part.is_low_stock ? '#ef4444' : 'inherit' }}>
                            {part.quantity_on_hand}
                          </span>
                          {part.is_low_stock && (
                            <span style={{ marginLeft: 6, fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                              LOW
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--muted)' }}>
                          {part.low_stock_threshold > 0 ? part.low_stock_threshold : '—'}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.8rem', color: part.active ? '#16a34a' : 'var(--muted)', fontWeight: 600 }}>
                            {part.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <button className='button button-secondary button-compact' style={{ fontSize: '0.8rem', marginRight: 4 }} onClick={() => startEdit(part)}>
                            Edit
                          </button>
                          {part.active && (
                            <button className='button button-secondary button-compact' style={{ fontSize: '0.8rem' }} onClick={() => handleDeactivate(part.id)}>
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    )
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
  padding: '10px 12px',
  verticalAlign: 'middle',
}
