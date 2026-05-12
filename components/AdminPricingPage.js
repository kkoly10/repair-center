'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'

export default function AdminPricingPage() {
  return (
    <AdminAuthGate>
      <AdminPricingPageInner />
    </AdminAuthGate>
  )
}

function formatPrice(rule) {
  if (rule.price_mode === 'manual') return 'Manual review'
  if (rule.price_mode === 'fixed' && rule.public_price_fixed != null) {
    return `$${Number(rule.public_price_fixed).toFixed(2)}`
  }
  if (rule.price_mode === 'range') {
    const min = rule.public_price_min != null ? `$${Number(rule.public_price_min).toFixed(2)}` : null
    const max = rule.public_price_max != null ? `$${Number(rule.public_price_max).toFixed(2)}` : null
    if (min && max) return `${min} – ${max}`
    if (min) return `From ${min}`
    if (max) return `Up to ${max}`
    return 'Range (unset)'
  }
  return '—'
}

function AdminPricingPageInner() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterText, setFilterText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetch('/admin/api/pricing')
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d.error || 'Failed'))))
      .then((data) => { setRules(data.rules || []); setLoading(false) })
      .catch((err) => { setLoadError(String(err)); setLoading(false) })
  }, [])

  const categories = useMemo(() => [...new Set(rules.map((r) => r.repair_catalog_models?.category).filter(Boolean))].sort(), [rules])
  const brands = useMemo(() => {
    const src = filterCategory ? rules.filter((r) => r.repair_catalog_models?.category === filterCategory) : rules
    return [...new Set(src.map((r) => r.repair_catalog_models?.repair_catalog_brands?.brand_name).filter(Boolean))].sort()
  }, [rules, filterCategory])

  const filtered = useMemo(() => {
    let list = rules
    if (filterCategory) list = list.filter((r) => r.repair_catalog_models?.category === filterCategory)
    if (filterBrand) list = list.filter((r) => r.repair_catalog_models?.repair_catalog_brands?.brand_name === filterBrand)
    if (filterText) {
      const q = filterText.toLowerCase()
      list = list.filter((r) =>
        (r.repair_catalog_models?.model_name || '').toLowerCase().includes(q) ||
        (r.repair_types?.repair_name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [rules, filterCategory, filterBrand, filterText])

  function startEdit(rule) {
    setEditingId(rule.id)
    setSaveError('')
    setEditDraft({
      price_mode: rule.price_mode || 'manual',
      public_price_fixed: rule.public_price_fixed ?? '',
      public_price_min: rule.public_price_min ?? '',
      public_price_max: rule.public_price_max ?? '',
      deposit_amount: rule.deposit_amount ?? '',
      return_shipping_fee: rule.return_shipping_fee ?? '',
      warranty_days: rule.warranty_days ?? '',
      active: rule.active !== false,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft({})
    setSaveError('')
  }

  async function saveEdit(ruleId) {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/admin/api/pricing/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save.')
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...json.rule } : r)))
      setEditingId(null)
      setEditDraft({})
    } catch (err) {
      setSaveError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <main className='page-hero'>
      <div className='site-shell'><div className='policy-card'>Loading pricing rules…</div></div>
    </main>
  )

  if (loadError) return (
    <main className='page-hero'>
      <div className='site-shell'><div className='notice'>{loadError}</div></div>
    </main>
  )

  const hasActiveRules = rules.some((r) => r.active)

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Admin — Pricing</div>
          <h1>Pricing Rules</h1>
          <p>
            Edit the public price shown to customers for each device and repair type. Set
            to <strong>Manual review</strong> to hide pricing and always require a custom quote.
          </p>
        </div>

        {rules.length > 0 && !hasActiveRules && (
          <div className='notice notice-warn'>
            No pricing rules are currently active. Customers will see every repair as requiring
            manual review. Activate at least one rule or set prices to make them visible.
          </div>
        )}

        <div className='policy-card'>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className='field' style={{ flex: '0 0 140px', marginBottom: 0 }}>
              <label style={labelStyle}>Category</label>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setFilterBrand('') }}
                style={inputStyle}
              >
                <option value=''>All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className='field' style={{ flex: '0 0 160px', marginBottom: 0 }}>
              <label style={labelStyle}>Brand</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                style={inputStyle}
              >
                <option value=''>All brands</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className='field' style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label style={labelStyle}>Search model or repair</label>
              <input
                type='text'
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={inputStyle}
                placeholder='e.g. iPhone 13, screen'
              />
            </div>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: 10 }}>
            Showing {filtered.length} of {rules.length} rules
          </p>
        </div>

        {!filtered.length ? (
          <div className='policy-card'>No pricing rules match this filter.</div>
        ) : (
          <div className='page-stack'>
            {filtered.map((rule) => {
              const model = rule.repair_catalog_models || {}
              const repairType = rule.repair_types || {}
              const brand = model.repair_catalog_brands?.brand_name || '—'
              const isEditing = editingId === rule.id

              return (
                <div key={rule.id} className='policy-card'>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div className='kicker'>{model.category || '—'} · {brand}</div>
                      <h3 style={{ margin: '4px 0' }}>{model.model_name || '—'}</h3>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{repairType.repair_name || '—'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!rule.active && <span className='mini-chip' style={{ background: 'var(--border)' }}>Inactive</span>}
                      {!isEditing && (
                        <button type='button' className='button button-secondary button-compact' onClick={() => startEdit(rule)}>
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className='preview-meta' style={{ marginTop: 14 }}>
                      <div className='preview-meta-row'>
                        <span>Price</span>
                        <span>{formatPrice(rule)}</span>
                      </div>
                      <div className='preview-meta-row'>
                        <span>Deposit</span>
                        <span>{rule.deposit_amount != null && Number(rule.deposit_amount) > 0 ? `$${Number(rule.deposit_amount).toFixed(2)}` : 'None'}</span>
                      </div>
                      <div className='preview-meta-row'>
                        <span>Return shipping</span>
                        <span>{rule.return_shipping_fee != null && Number(rule.return_shipping_fee) > 0 ? `$${Number(rule.return_shipping_fee).toFixed(2)}` : 'None'}</span>
                      </div>
                      <div className='preview-meta-row'>
                        <span>Warranty</span>
                        <span>{rule.warranty_days != null ? `${rule.warranty_days} days` : '—'}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Price mode</label>
                          <select
                            value={editDraft.price_mode}
                            onChange={(e) => setEditDraft((d) => ({ ...d, price_mode: e.target.value }))}
                            style={inputStyle}
                          >
                            <option value='fixed'>Fixed</option>
                            <option value='range'>Range</option>
                            <option value='manual'>Manual review</option>
                          </select>
                        </div>

                        {editDraft.price_mode === 'fixed' && (
                          <div>
                            <label style={labelStyle}>Fixed price ($)</label>
                            <input type='number' min='0' step='0.01' value={editDraft.public_price_fixed}
                              onChange={(e) => setEditDraft((d) => ({ ...d, public_price_fixed: e.target.value }))}
                              style={inputStyle} placeholder='0.00' />
                          </div>
                        )}

                        {editDraft.price_mode === 'range' && (
                          <>
                            <div>
                              <label style={labelStyle}>Min price ($)</label>
                              <input type='number' min='0' step='0.01' value={editDraft.public_price_min}
                                onChange={(e) => setEditDraft((d) => ({ ...d, public_price_min: e.target.value }))}
                                style={inputStyle} placeholder='0.00' />
                            </div>
                            <div>
                              <label style={labelStyle}>Max price ($)</label>
                              <input type='number' min='0' step='0.01' value={editDraft.public_price_max}
                                onChange={(e) => setEditDraft((d) => ({ ...d, public_price_max: e.target.value }))}
                                style={inputStyle} placeholder='0.00' />
                            </div>
                          </>
                        )}

                        <div>
                          <label style={labelStyle}>Deposit ($)</label>
                          <input type='number' min='0' step='0.01' value={editDraft.deposit_amount}
                            onChange={(e) => setEditDraft((d) => ({ ...d, deposit_amount: e.target.value }))}
                            style={inputStyle} placeholder='0.00' />
                        </div>

                        <div>
                          <label style={labelStyle}>Return shipping ($)</label>
                          <input type='number' min='0' step='0.01' value={editDraft.return_shipping_fee}
                            onChange={(e) => setEditDraft((d) => ({ ...d, return_shipping_fee: e.target.value }))}
                            style={inputStyle} placeholder='0.00' />
                        </div>

                        <div>
                          <label style={labelStyle}>Warranty (days)</label>
                          <input type='number' min='0' step='1' value={editDraft.warranty_days}
                            onChange={(e) => setEditDraft((d) => ({ ...d, warranty_days: e.target.value }))}
                            style={inputStyle} placeholder='90' />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type='checkbox' id={`active-${rule.id}`} checked={editDraft.active}
                          onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.checked }))}
                          style={{ width: 18, height: 18, cursor: 'pointer' }} />
                        <label htmlFor={`active-${rule.id}`} style={{ fontWeight: 600, cursor: 'pointer' }}>
                          Rule is active (shown to customers)
                        </label>
                      </div>

                      {saveError ? <div className='notice notice-warn'>{saveError}</div> : null}

                      <div className='inline-actions'>
                        <button type='button' className='button button-primary' disabled={saving} onClick={() => saveEdit(rule.id)}>
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button type='button' className='button button-secondary' disabled={saving} onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.95rem', boxSizing: 'border-box' }
