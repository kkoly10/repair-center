'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminPricingPage() {
  return (
    <AdminAuthGate>
      <AdminPricingPageInner />
    </AdminAuthGate>
  )
}

function formatPrice(rule, t) {
  if (rule.price_mode === 'manual') return t('adminPricing.manualReview')
  if (rule.price_mode === 'fixed' && rule.public_price_fixed != null) {
    return `$${Number(rule.public_price_fixed).toFixed(2)}`
  }
  if (rule.price_mode === 'range') {
    const min = rule.public_price_min != null ? `$${Number(rule.public_price_min).toFixed(2)}` : null
    const max = rule.public_price_max != null ? `$${Number(rule.public_price_max).toFixed(2)}` : null
    if (min && max) return `${min} – ${max}`
    if (min) return t('adminPricing.priceFrom', { price: min })
    if (max) return t('adminPricing.priceUpTo', { price: max })
    return t('adminPricing.rangeUnset')
  }
  return '—'
}

const EMPTY_ADD = { modelId: '', repairTypeId: '', priceMode: 'manual', publicPriceFixed: '', publicPriceMin: '', publicPriceMax: '', depositAmount: '', warrantyDays: '' }

function AdminPricingPageInner() {
  const t = useT()
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

  // Add rule state
  const [showAddForm, setShowAddForm] = useState(false)
  const [catalog, setCatalog] = useState(null)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [addDraft, setAddDraft] = useState(EMPTY_ADD)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  // Delete state
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetch('/admin/api/pricing')
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d.error || 'Failed'))))
      .then((data) => { setRules(data.rules || []); setLoading(false) })
      .catch((err) => { setLoadError(String(err)); setLoading(false) })
  }, [])

  function openAddForm() {
    setShowAddForm(true)
    setAddDraft(EMPTY_ADD)
    setAddError('')
    if (!catalog) {
      setCatalogLoading(true)
      fetch('/admin/api/catalog')
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) setCatalog(json)
          else setAddError(json.error || t('adminPricing.errorLoadCatalog'))
        })
        .catch(() => setAddError(t('adminPricing.errorLoadCatalog')))
        .finally(() => setCatalogLoading(false))
    }
  }

  function closeAddForm() {
    setShowAddForm(false)
    setAddDraft(EMPTY_ADD)
    setAddError('')
  }

  async function submitAdd(e) {
    e.preventDefault()
    if (!addDraft.modelId || !addDraft.repairTypeId) {
      setAddError(t('adminPricing.errorSelectModelAndType'))
      return
    }
    setAddSaving(true)
    setAddError('')
    try {
      const res = await fetch('/admin/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: addDraft.modelId,
          repairTypeId: addDraft.repairTypeId,
          priceMode: addDraft.priceMode,
          publicPriceFixed: addDraft.publicPriceFixed !== '' ? addDraft.publicPriceFixed : null,
          publicPriceMin: addDraft.publicPriceMin !== '' ? addDraft.publicPriceMin : null,
          publicPriceMax: addDraft.publicPriceMax !== '' ? addDraft.publicPriceMax : null,
          depositAmount: addDraft.depositAmount !== '' ? addDraft.depositAmount : null,
          warrantyDays: addDraft.warrantyDays !== '' ? addDraft.warrantyDays : null,
          active: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('adminPricing.errorCreate'))
      setRules((prev) => [...prev, json.rule])
      setCatalog((prev) => prev ? { ...prev, existingKeys: [...(prev.existingKeys || []), `${addDraft.modelId}:${addDraft.repairTypeId}`] } : prev)
      closeAddForm()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddSaving(false)
    }
  }

  async function handleDelete(ruleId) {
    setPendingDeleteId(null)
    setDeletingId(ruleId)
    setDeleteError('')
    try {
      const res = await fetch(`/admin/api/pricing/${ruleId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        setDeleteError(json.error || t('adminPricing.errorDelete'))
        return
      }
      setRules((prev) => prev.filter((r) => r.id !== ruleId))
      if (editingId === ruleId) { setEditingId(null); setEditDraft({}) }
    } catch {
      setDeleteError(t('adminPricing.errorNetwork'))
    } finally {
      setDeletingId(null)
    }
  }

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

  // Catalog selectors derived from fetched catalog
  const existingKeys = useMemo(() => new Set(catalog?.existingKeys || []), [catalog])
  const catalogRepairTypes = catalog?.repairTypes || []

  // Group models by category then brand for the add form selector
  const modelGroups = useMemo(() => {
    const models = catalog?.models || []
    const map = {}
    for (const m of models) {
      const cat = m.category || t('adminPricing.categoryOther')
      const brand = m.repair_catalog_brands?.brand_name || t('adminPricing.unknownBrand')
      const key = `${cat} — ${brand}`
      if (!map[key]) map[key] = []
      map[key].push(m)
    }
    return map
  }, [catalog, t])

  const addRepairTypeId = addDraft.repairTypeId
  const addModelId = addDraft.modelId
  const isDuplicate = addModelId && addRepairTypeId && existingKeys.has(`${addModelId}:${addRepairTypeId}`)

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
      if (!res.ok) throw new Error(json.error || t('adminPricing.errorSave'))
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...json.rule } : r)))
      setEditingId(null)
      setEditDraft({})
    } catch (err) {
      setSaveError(err.message || t('adminPricing.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <main className='page-hero'>
      <div className='site-shell'><div className='policy-card'>{t('adminPricing.loadingRules')}</div></div>
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
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className='kicker'>{t('adminPricing.kicker')}</div>
              <h1>{t('adminPricing.title')}</h1>
              <p>{t('adminPricing.intro')}</p>
            </div>
            <div>
              <button type='button' className='button button-primary' onClick={openAddForm} style={{ marginTop: 4 }}>
                {t('adminPricing.addRuleButton')}
              </button>
            </div>
          </div>
        </div>

        {deleteError && (
          <div className='notice notice-warn' style={{ marginBottom: 12 }}>{deleteError}</div>
        )}

        {rules.length > 0 && !hasActiveRules && (
          <div className='notice notice-warn'>
            {t('adminPricing.noActiveRulesWarning')}
          </div>
        )}

        {/* Add Rule form */}
        {showAddForm && (
          <div className='policy-card'>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem' }}>{t('adminPricing.addRuleTitle')}</h3>
            {catalogLoading ? (
              <p style={{ color: 'var(--muted)' }}>{t('adminPricing.loadingCatalog')}</p>
            ) : (
              <form onSubmit={submitAdd}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('adminPricing.deviceModelLabel')}</label>
                    <select
                      value={addDraft.modelId}
                      onChange={(e) => setAddDraft((d) => ({ ...d, modelId: e.target.value }))}
                      style={inputStyle}
                      required
                    >
                      <option value=''>{t('adminPricing.selectModel')}</option>
                      {Object.entries(modelGroups).sort(([a], [b]) => a.localeCompare(b)).map(([groupLabel, models]) => (
                        <optgroup key={groupLabel} label={groupLabel}>
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>{m.model_name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('adminPricing.repairTypeLabel')}</label>
                    <select
                      value={addDraft.repairTypeId}
                      onChange={(e) => setAddDraft((d) => ({ ...d, repairTypeId: e.target.value }))}
                      style={inputStyle}
                      required
                    >
                      <option value=''>{t('adminPricing.selectRepairType')}</option>
                      {catalogRepairTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>{rt.repair_name}</option>
                      ))}
                    </select>
                    {isDuplicate && (
                      <p style={{ margin: '6px 0 0', color: 'var(--warn, #d97706)', fontSize: '0.85rem' }}>
                        {t('adminPricing.duplicateWarning')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>{t('adminPricing.priceModeLabel')}</label>
                    <select
                      value={addDraft.priceMode}
                      onChange={(e) => setAddDraft((d) => ({ ...d, priceMode: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value='fixed'>{t('adminPricing.priceModeFixed')}</option>
                      <option value='range'>{t('adminPricing.priceModeRange')}</option>
                      <option value='manual'>{t('adminPricing.priceModeManual')}</option>
                    </select>
                  </div>

                  {addDraft.priceMode === 'fixed' && (
                    <div>
                      <label style={labelStyle}>{t('adminPricing.fixedPriceLabel')}</label>
                      <input type='number' min='0' step='0.01' value={addDraft.publicPriceFixed}
                        onChange={(e) => setAddDraft((d) => ({ ...d, publicPriceFixed: e.target.value }))}
                        style={inputStyle} placeholder='0.00' />
                    </div>
                  )}

                  {addDraft.priceMode === 'range' && (
                    <>
                      <div>
                        <label style={labelStyle}>{t('adminPricing.minPriceLabel')}</label>
                        <input type='number' min='0' step='0.01' value={addDraft.publicPriceMin}
                          onChange={(e) => setAddDraft((d) => ({ ...d, publicPriceMin: e.target.value }))}
                          style={inputStyle} placeholder='0.00' />
                      </div>
                      <div>
                        <label style={labelStyle}>{t('adminPricing.maxPriceLabel')}</label>
                        <input type='number' min='0' step='0.01' value={addDraft.publicPriceMax}
                          onChange={(e) => setAddDraft((d) => ({ ...d, publicPriceMax: e.target.value }))}
                          style={inputStyle} placeholder='0.00' />
                      </div>
                    </>
                  )}

                  <div>
                    <label style={labelStyle}>{t('adminPricing.depositLabel')}</label>
                    <input type='number' min='0' step='0.01' value={addDraft.depositAmount}
                      onChange={(e) => setAddDraft((d) => ({ ...d, depositAmount: e.target.value }))}
                      style={inputStyle} placeholder='0.00' />
                  </div>

                  <div>
                    <label style={labelStyle}>{t('adminPricing.warrantyLabel')}</label>
                    <input type='number' min='0' step='1' value={addDraft.warrantyDays}
                      onChange={(e) => setAddDraft((d) => ({ ...d, warrantyDays: e.target.value }))}
                      style={inputStyle} placeholder='90' />
                  </div>
                </div>

                {addError && <div className='notice notice-warn' style={{ marginBottom: 14 }}>{addError}</div>}

                <div className='inline-actions'>
                  <button type='submit' className='button button-primary' disabled={addSaving || !!isDuplicate}>
                    {addSaving ? t('adminPricing.adding') : t('adminPricing.addRuleSubmit')}
                  </button>
                  <button type='button' className='button button-secondary' onClick={closeAddForm}>{t('adminPricing.cancel')}</button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className='policy-card'>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className='field' style={{ flex: '0 0 140px', marginBottom: 0 }}>
              <label style={labelStyle}>{t('adminPricing.categoryLabel')}</label>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setFilterBrand('') }}
                style={inputStyle}
              >
                <option value=''>{t('adminPricing.allCategories')}</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className='field' style={{ flex: '0 0 160px', marginBottom: 0 }}>
              <label style={labelStyle}>{t('adminPricing.brandLabel')}</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                style={inputStyle}
              >
                <option value=''>{t('adminPricing.allBrands')}</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className='field' style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label style={labelStyle}>{t('adminPricing.searchLabel')}</label>
              <input
                type='text'
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={inputStyle}
                placeholder={t('adminPricing.searchPlaceholder')}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: 10 }}>
            {t('adminPricing.showingCount', { count: filtered.length, total: rules.length })}
          </p>
        </div>

        {!filtered.length ? (
          <div className='policy-card'>{t('adminPricing.noMatching')}</div>
        ) : (
          <div className='page-stack'>
            {filtered.map((rule) => {
              const model = rule.repair_catalog_models || {}
              const repairType = rule.repair_types || {}
              const brand = model.repair_catalog_brands?.brand_name || '—'
              const isEditing = editingId === rule.id
              const isDeleting = deletingId === rule.id

              return (
                <div key={rule.id} className='policy-card'>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div className='kicker'>{model.category || '—'} · {brand}</div>
                      <h3 style={{ margin: '4px 0' }}>{model.model_name || '—'}</h3>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{repairType.repair_name || '—'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!rule.active && <span className='mini-chip' style={{ background: 'var(--border)' }}>{t('adminPricing.inactive')}</span>}
                      {!isEditing && (
                        <>
                          <button type='button' className='button button-secondary button-compact' onClick={() => startEdit(rule)}>
                            {t('adminPricing.edit')}
                          </button>
                          {pendingDeleteId === rule.id ? (
                            <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                              <span style={{ color: 'var(--danger, #dc2626)' }}>{t('adminPricing.confirmDelete')}</span>
                              <button type='button' className='button button-compact' style={{ fontSize: 12, background: 'var(--danger, #dc2626)', color: '#fff', border: 'none' }} disabled={isDeleting} onClick={() => handleDelete(rule.id)}>{isDeleting ? '…' : t('adminPricing.confirmYes')}</button>
                              <button type='button' className='button button-secondary button-compact' style={{ fontSize: 12 }} onClick={() => setPendingDeleteId(null)}>{t('adminPricing.confirmNo')}</button>
                            </span>
                          ) : (
                            <button
                              type='button'
                              className='button button-secondary button-compact'
                              style={{ color: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)' }}
                              disabled={isDeleting}
                              onClick={() => setPendingDeleteId(rule.id)}
                            >
                              {t('adminPricing.delete')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className='preview-meta' style={{ marginTop: 14 }}>
                      <div className='preview-meta-row'>
                        <span>{t('adminPricing.priceRow')}</span>
                        <span>{formatPrice(rule, t)}</span>
                      </div>
                      <div className='preview-meta-row'>
                        <span>{t('adminPricing.depositRow')}</span>
                        <span>{rule.deposit_amount != null && Number(rule.deposit_amount) > 0 ? `$${Number(rule.deposit_amount).toFixed(2)}` : t('adminPricing.none')}</span>
                      </div>
                      <div className='preview-meta-row'>
                        <span>{t('adminPricing.returnShippingRow')}</span>
                        <span>{rule.return_shipping_fee != null && Number(rule.return_shipping_fee) > 0 ? `$${Number(rule.return_shipping_fee).toFixed(2)}` : t('adminPricing.none')}</span>
                      </div>
                      <div className='preview-meta-row'>
                        <span>{t('adminPricing.warrantyRow')}</span>
                        <span>{rule.warranty_days != null ? t('adminPricing.daysValue', { days: rule.warranty_days }) : '—'}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                        <div>
                          <label style={labelStyle}>{t('adminPricing.priceModeLabel')}</label>
                          <select
                            value={editDraft.price_mode}
                            onChange={(e) => setEditDraft((d) => ({ ...d, price_mode: e.target.value }))}
                            style={inputStyle}
                          >
                            <option value='fixed'>{t('adminPricing.priceModeFixed')}</option>
                            <option value='range'>{t('adminPricing.priceModeRange')}</option>
                            <option value='manual'>{t('adminPricing.priceModeManual')}</option>
                          </select>
                        </div>

                        {editDraft.price_mode === 'fixed' && (
                          <div>
                            <label style={labelStyle}>{t('adminPricing.fixedPriceLabel')}</label>
                            <input type='number' min='0' step='0.01' value={editDraft.public_price_fixed}
                              onChange={(e) => setEditDraft((d) => ({ ...d, public_price_fixed: e.target.value }))}
                              style={inputStyle} placeholder='0.00' />
                          </div>
                        )}

                        {editDraft.price_mode === 'range' && (
                          <>
                            <div>
                              <label style={labelStyle}>{t('adminPricing.minPriceLabel')}</label>
                              <input type='number' min='0' step='0.01' value={editDraft.public_price_min}
                                onChange={(e) => setEditDraft((d) => ({ ...d, public_price_min: e.target.value }))}
                                style={inputStyle} placeholder='0.00' />
                            </div>
                            <div>
                              <label style={labelStyle}>{t('adminPricing.maxPriceLabel')}</label>
                              <input type='number' min='0' step='0.01' value={editDraft.public_price_max}
                                onChange={(e) => setEditDraft((d) => ({ ...d, public_price_max: e.target.value }))}
                                style={inputStyle} placeholder='0.00' />
                            </div>
                          </>
                        )}

                        <div>
                          <label style={labelStyle}>{t('adminPricing.depositLabel')}</label>
                          <input type='number' min='0' step='0.01' value={editDraft.deposit_amount}
                            onChange={(e) => setEditDraft((d) => ({ ...d, deposit_amount: e.target.value }))}
                            style={inputStyle} placeholder='0.00' />
                        </div>

                        <div>
                          <label style={labelStyle}>{t('adminPricing.returnShippingLabel')}</label>
                          <input type='number' min='0' step='0.01' value={editDraft.return_shipping_fee}
                            onChange={(e) => setEditDraft((d) => ({ ...d, return_shipping_fee: e.target.value }))}
                            style={inputStyle} placeholder='0.00' />
                        </div>

                        <div>
                          <label style={labelStyle}>{t('adminPricing.warrantyLabel')}</label>
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
                          {t('adminPricing.ruleIsActive')}
                        </label>
                      </div>

                      {saveError ? <div className='notice notice-warn'>{saveError}</div> : null}

                      <div className='inline-actions'>
                        <button type='button' className='button button-primary' disabled={saving} onClick={() => saveEdit(rule.id)}>
                          {saving ? t('adminPricing.saving') : t('adminPricing.save')}
                        </button>
                        <button type='button' className='button button-secondary' disabled={saving} onClick={cancelEdit}>
                          {t('adminPricing.cancel')}
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
