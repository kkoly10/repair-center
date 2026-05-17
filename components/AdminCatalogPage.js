'use client'
import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n/TranslationProvider'

const CATEGORIES = ['phone', 'tablet', 'laptop', 'desktop']
const PRICE_MODES = ['fixed', 'range', 'manual']

function GlobalBadge() {
  const t = useT()
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {t('adminCatalog.badgeGlobal')}
    </span>
  )
}

function CustomBadge() {
  const t = useT()
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {t('adminCatalog.badgeCustom')}
    </span>
  )
}

// ── Brands Tab ────────────────────────────────────────────────────────────────

function BrandsTab() {
  const t = useT()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ brandName: '', category: 'phone' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  useEffect(() => {
    fetch('/admin/api/catalog/brands')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setBrands(d.brands || []); else setError(d.error || t('adminCatalog.errorLoadBrands')); setLoading(false) })
      .catch(() => { setError(t('adminCatalog.errorLoadBrands')); setLoading(false) })
  }, [t])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch('/admin/api/catalog/brands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error || t('adminCatalog.errorAddBrand')); return }
      setBrands((prev) => [...prev, json.brand].sort((a, b) => a.brand_name.localeCompare(b.brand_name)))
      setDraft({ brandName: '', category: 'phone' })
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  async function handleSaveEdit(brandId) {
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch(`/admin/api/catalog/brands/${brandId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error || t('adminCatalog.errorSaveChanges')); return }
      setBrands((prev) => prev.map((b) => b.id === brandId ? json.brand : b))
      setEditId(null)
    } finally { setSaving(false) }
  }

  async function handleDelete(brandId) {
    setDeleteConfirmId(null)
    setActionError('')
    const res = await fetch(`/admin/api/catalog/brands/${brandId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error || t('adminCatalog.errorDeleteBrand')); return }
    setBrands((prev) => prev.filter((b) => b.id !== brandId))
  }

  if (loading) return <div style={{ color: 'var(--muted)', padding: 24 }}>{t('adminCatalog.loading')}</div>
  if (error) return <div className='notice-error'>{error}</div>

  const customCount = brands.filter((b) => b.is_org_owned).length
  const globalCount = brands.filter((b) => !b.is_org_owned).length

  return (
    <div>
      {actionError && <div className='notice notice-warn' style={{ marginBottom: 12 }}>{actionError}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#555' }}>
          {customCount === 1
            ? t('adminCatalog.brandCountsOne', { custom: String(customCount), global: String(globalCount) })
            : t('adminCatalog.brandCountsOther', { custom: String(customCount), global: String(globalCount) })}
        </div>
        <button className='button' onClick={() => setShowAdd((v) => !v)} style={{ fontSize: 13, padding: '5px 14px' }}>
          {showAdd ? t('adminCatalog.cancel') : t('adminCatalog.addBrand')}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className='policy-card' style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.brandNameLabel')}</label>
            <input className='input' value={draft.brandName} onChange={(e) => setDraft((d) => ({ ...d, brandName: e.target.value }))} placeholder={t('adminCatalog.brandNamePlaceholder')} required style={{ width: 200 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.categoryLabel')}</label>
            <select className='input' value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`adminCatalog.category_${c}`)}</option>)}
            </select>
          </div>
          <button className='button' type='submit' disabled={saving} style={{ alignSelf: 'flex-end' }}>{t('adminCatalog.save')}</button>
        </form>
      )}

      <div className='policy-card' style={{ padding: 0, overflow: 'hidden' }}>
        <table width='100%' style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
              {[t('adminCatalog.colBrand'), t('adminCatalog.colCategory'), t('adminCatalog.colStatus'), t('adminCatalog.colType'), ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 500 }}>
                  {editId === brand.id ? (
                    <input className='input' value={editDraft.brandName ?? brand.brand_name} onChange={(e) => setEditDraft((d) => ({ ...d, brandName: e.target.value }))} style={{ width: 160 }} />
                  ) : brand.brand_name}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  {editId === brand.id ? (
                    <select className='input' value={editDraft.category ?? brand.category} onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{t(`adminCatalog.category_${c}`)}</option>)}
                    </select>
                  ) : t(`adminCatalog.category_${brand.category}`)}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {editId === brand.id ? (
                    <select className='input' value={String(editDraft.active ?? brand.active)} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.value === 'true' }))}>
                      <option value='true'>{t('adminCatalog.active')}</option>
                      <option value='false'>{t('adminCatalog.inactive')}</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: brand.active ? '#166534' : '#991b1b' }}>{brand.active ? t('adminCatalog.active') : t('adminCatalog.inactive')}</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>{brand.is_org_owned ? <CustomBadge /> : <GlobalBadge />}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  {brand.is_org_owned && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {editId === brand.id ? (
                        <>
                          <button className='button button-small' onClick={() => handleSaveEdit(brand.id)} disabled={saving} style={{ fontSize: 12 }}>{t('adminCatalog.save')}</button>
                          <button className='button button-small' onClick={() => setEditId(null)} style={{ fontSize: 12, background: '#f3f4f6', color: '#374151' }}>{t('adminCatalog.cancel')}</button>
                        </>
                      ) : deleteConfirmId === brand.id ? (
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                          <span style={{ color: 'var(--danger, #dc2626)' }}>{t('adminCatalog.confirmDeleteBrand')}</span>
                          <button className='button button-small' onClick={() => handleDelete(brand.id)} style={{ fontSize: 12, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{t('adminCatalog.confirmYes')}</button>
                          <button className='button button-small' onClick={() => setDeleteConfirmId(null)} style={{ fontSize: 12, background: '#f3f4f6', color: '#374151' }}>{t('adminCatalog.confirmNo')}</button>
                        </span>
                      ) : (
                        <>
                          <button className='button button-small' onClick={() => { setEditId(brand.id); setEditDraft({}) }} style={{ fontSize: 12 }}>{t('adminCatalog.edit')}</button>
                          <button className='button button-small' onClick={() => setDeleteConfirmId(brand.id)} style={{ fontSize: 12, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{t('adminCatalog.delete')}</button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Models Tab ────────────────────────────────────────────────────────────────

function ModelsTab() {
  const t = useT()
  const [models, setModels] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ modelName: '', familyName: '', brandId: '', category: 'phone' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [search, setSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/admin/api/catalog/models').then((r) => r.json()),
      fetch('/admin/api/catalog/brands').then((r) => r.json()),
    ]).then(([mRes, bRes]) => {
      if (mRes.ok) setModels(mRes.models || []); else setError(mRes.error || t('adminCatalog.errorLoadModels'))
      if (bRes.ok) setBrands(bRes.brands || [])
      setLoading(false)
    }).catch(() => { setError(t('adminCatalog.errorLoad')); setLoading(false) })
  }, [t])

  const filtered = search.trim()
    ? models.filter((m) => m.model_name.toLowerCase().includes(search.toLowerCase()) || m.repair_catalog_brands?.brand_name?.toLowerCase().includes(search.toLowerCase()))
    : models

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch('/admin/api/catalog/models', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error || t('adminCatalog.errorAddModel')); return }
      setModels((prev) => [...prev, json.model].sort((a, b) => a.model_name.localeCompare(b.model_name)))
      setDraft({ modelName: '', familyName: '', brandId: '', category: 'phone' })
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  async function handleSaveEdit(modelId) {
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch(`/admin/api/catalog/models/${modelId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error || t('adminCatalog.errorSaveChanges')); return }
      setModels((prev) => prev.map((m) => m.id === modelId ? json.model : m))
      setEditId(null)
    } finally { setSaving(false) }
  }

  async function handleDelete(modelId) {
    setDeleteConfirmId(null)
    setActionError('')
    const res = await fetch(`/admin/api/catalog/models/${modelId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error || t('adminCatalog.errorDeleteModel')); return }
    setModels((prev) => prev.filter((m) => m.id !== modelId))
  }

  if (loading) return <div style={{ color: 'var(--muted)', padding: 24 }}>{t('adminCatalog.loading')}</div>
  if (error) return <div className='notice-error'>{error}</div>

  const customCount = models.filter((m) => m.is_org_owned).length
  const globalCount = models.filter((m) => !m.is_org_owned).length

  return (
    <div>
      {actionError && <div className='notice notice-warn' style={{ marginBottom: 12 }}>{actionError}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <input className='input' placeholder={t('adminCatalog.searchModelsPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220, fontSize: 13 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#555' }}>{t('adminCatalog.itemCounts', { custom: String(customCount), global: String(globalCount) })}</span>
          <button className='button' onClick={() => setShowAdd((v) => !v)} style={{ fontSize: 13, padding: '5px 14px' }}>
            {showAdd ? t('adminCatalog.cancel') : t('adminCatalog.addModel')}
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className='policy-card' style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.brandLabel')}</label>
            <select className='input' value={draft.brandId} onChange={(e) => setDraft((d) => ({ ...d, brandId: e.target.value }))} required>
              <option value=''>{t('adminCatalog.selectBrand')}</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.brand_name} ({t(`adminCatalog.category_${b.category}`)})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.modelNameLabel')}</label>
            <input className='input' value={draft.modelName} onChange={(e) => setDraft((d) => ({ ...d, modelName: e.target.value }))} placeholder={t('adminCatalog.modelNamePlaceholder')} required style={{ width: 160 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.familyLabel')}</label>
            <input className='input' value={draft.familyName} onChange={(e) => setDraft((d) => ({ ...d, familyName: e.target.value }))} placeholder={t('adminCatalog.familyPlaceholder')} style={{ width: 120 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.categoryLabel')}</label>
            <select className='input' value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`adminCatalog.category_${c}`)}</option>)}
            </select>
          </div>
          <button className='button' type='submit' disabled={saving} style={{ alignSelf: 'flex-end' }}>{t('adminCatalog.save')}</button>
        </form>
      )}

      <div className='policy-card' style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table width='100%' style={{ borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                {[t('adminCatalog.colModel'), t('adminCatalog.colBrand'), t('adminCatalog.colCategory'), t('adminCatalog.colStatus'), t('adminCatalog.colType'), ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((model) => (
                <tr key={model.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 500 }}>
                    {editId === model.id ? (
                      <input className='input' value={editDraft.modelName ?? model.model_name} onChange={(e) => setEditDraft((d) => ({ ...d, modelName: e.target.value }))} style={{ width: 140 }} />
                    ) : (
                      <>
                        {model.model_name}
                        {model.family_name && <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>({model.family_name})</span>}
                      </>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{model.repair_catalog_brands?.brand_name || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    {editId === model.id ? (
                      <select className='input' value={editDraft.category ?? model.category} onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{t(`adminCatalog.category_${c}`)}</option>)}
                      </select>
                    ) : t(`adminCatalog.category_${model.category}`)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {editId === model.id ? (
                      <select className='input' value={String(editDraft.active ?? model.active)} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.value === 'true' }))}>
                        <option value='true'>{t('adminCatalog.active')}</option>
                        <option value='false'>{t('adminCatalog.inactive')}</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: model.active ? '#166534' : '#991b1b' }}>{model.active ? t('adminCatalog.active') : t('adminCatalog.inactive')}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{model.is_org_owned ? <CustomBadge /> : <GlobalBadge />}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    {model.is_org_owned && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {editId === model.id ? (
                          <>
                            <button className='button button-small' onClick={() => handleSaveEdit(model.id)} disabled={saving} style={{ fontSize: 12 }}>{t('adminCatalog.save')}</button>
                            <button className='button button-small' onClick={() => setEditId(null)} style={{ fontSize: 12, background: '#f3f4f6', color: '#374151' }}>{t('adminCatalog.cancel')}</button>
                          </>
                        ) : deleteConfirmId === model.id ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--danger, #dc2626)' }}>{t('adminCatalog.confirmDeleteModel')}</span>
                            <button className='button button-small' onClick={() => handleDelete(model.id)} style={{ fontSize: 12, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{t('adminCatalog.confirmYes')}</button>
                            <button className='button button-small' onClick={() => setDeleteConfirmId(null)} style={{ fontSize: 12, background: '#f3f4f6', color: '#374151' }}>{t('adminCatalog.confirmNo')}</button>
                          </span>
                        ) : (
                          <>
                            <button className='button button-small' onClick={() => { setEditId(model.id); setEditDraft({}) }} style={{ fontSize: 12 }}>{t('adminCatalog.edit')}</button>
                            <button className='button button-small' onClick={() => setDeleteConfirmId(model.id)} style={{ fontSize: 12, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{t('adminCatalog.delete')}</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>{t('adminCatalog.noModelsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Repair Types Tab ──────────────────────────────────────────────────────────

function RepairTypesTab() {
  const t = useT()
  const [repairTypes, setRepairTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ repairName: '', category: '', priceModeDefault: 'manual', warrantyDaysDefault: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  useEffect(() => {
    fetch('/admin/api/catalog/repair-types')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setRepairTypes(d.repairTypes || []); else setError(d.error || t('adminCatalog.errorLoadRepairTypes')); setLoading(false) })
      .catch(() => { setError(t('adminCatalog.errorLoadRepairTypes')); setLoading(false) })
  }, [t])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch('/admin/api/catalog/repair-types', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error || t('adminCatalog.errorAddRepairType')); return }
      setRepairTypes((prev) => [...prev, json.repairType].sort((a, b) => a.repair_name.localeCompare(b.repair_name)))
      setDraft({ repairName: '', category: '', priceModeDefault: 'manual', warrantyDaysDefault: '' })
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  async function handleSaveEdit(typeId) {
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch(`/admin/api/catalog/repair-types/${typeId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error || t('adminCatalog.errorSaveChanges')); return }
      setRepairTypes((prev) => prev.map((r) => r.id === typeId ? json.repairType : r))
      setEditId(null)
    } finally { setSaving(false) }
  }

  async function handleDelete(typeId) {
    setDeleteConfirmId(null)
    setActionError('')
    const res = await fetch(`/admin/api/catalog/repair-types/${typeId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error || t('adminCatalog.errorDeleteRepairType')); return }
    setRepairTypes((prev) => prev.filter((r) => r.id !== typeId))
  }

  if (loading) return <div style={{ color: 'var(--muted)', padding: 24 }}>{t('adminCatalog.loading')}</div>
  if (error) return <div className='notice-error'>{error}</div>

  const customCount = repairTypes.filter((r) => r.is_org_owned).length
  const globalCount = repairTypes.filter((r) => !r.is_org_owned).length

  return (
    <div>
      {actionError && <div className='notice notice-warn' style={{ marginBottom: 12 }}>{actionError}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#555' }}>{t('adminCatalog.itemCounts', { custom: String(customCount), global: String(globalCount) })}</div>
        <button className='button' onClick={() => setShowAdd((v) => !v)} style={{ fontSize: 13, padding: '5px 14px' }}>
          {showAdd ? t('adminCatalog.cancel') : t('adminCatalog.addRepairType')}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className='policy-card' style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.repairNameLabel')}</label>
            <input className='input' value={draft.repairName} onChange={(e) => setDraft((d) => ({ ...d, repairName: e.target.value }))} placeholder={t('adminCatalog.repairNamePlaceholder')} required style={{ width: 200 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.categoryOptionalLabel')}</label>
            <select className='input' value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
              <option value=''>{t('adminCatalog.allDevices')}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`adminCatalog.category_${c}`)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.priceModeLabel')}</label>
            <select className='input' value={draft.priceModeDefault} onChange={(e) => setDraft((d) => ({ ...d, priceModeDefault: e.target.value }))}>
              {PRICE_MODES.map((m) => <option key={m} value={m}>{t(`adminCatalog.priceMode_${m}`)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminCatalog.warrantyDaysLabel')}</label>
            <input className='input' type='number' min='0' value={draft.warrantyDaysDefault} onChange={(e) => setDraft((d) => ({ ...d, warrantyDaysDefault: e.target.value }))} placeholder={t('adminCatalog.warrantyDaysPlaceholder')} style={{ width: 90 }} />
          </div>
          <button className='button' type='submit' disabled={saving} style={{ alignSelf: 'flex-end' }}>{t('adminCatalog.save')}</button>
        </form>
      )}

      <div className='policy-card' style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table width='100%' style={{ borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                {[t('adminCatalog.colRepairType'), t('adminCatalog.colCategory'), t('adminCatalog.colPriceMode'), t('adminCatalog.colWarranty'), t('adminCatalog.colStatus'), t('adminCatalog.colType'), ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repairTypes.map((rt) => (
                <tr key={rt.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 500 }}>
                    {editId === rt.id ? (
                      <input className='input' value={editDraft.repairName ?? rt.repair_name} onChange={(e) => setEditDraft((d) => ({ ...d, repairName: e.target.value }))} style={{ width: 160 }} />
                    ) : rt.repair_name}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    {editId === rt.id ? (
                      <select className='input' value={editDraft.category ?? (rt.category || '')} onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}>
                        <option value=''>{t('adminCatalog.all')}</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{t(`adminCatalog.category_${c}`)}</option>)}
                      </select>
                    ) : (rt.category ? t(`adminCatalog.category_${rt.category}`) : t('adminCatalog.all'))}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    {editId === rt.id ? (
                      <select className='input' value={editDraft.priceModeDefault ?? rt.price_mode_default} onChange={(e) => setEditDraft((d) => ({ ...d, priceModeDefault: e.target.value }))}>
                        {PRICE_MODES.map((m) => <option key={m} value={m}>{t(`adminCatalog.priceMode_${m}`)}</option>)}
                      </select>
                    ) : t(`adminCatalog.priceMode_${rt.price_mode_default}`)}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    {editId === rt.id ? (
                      <input className='input' type='number' min='0' value={editDraft.warrantyDaysDefault ?? (rt.warranty_days_default || '')} onChange={(e) => setEditDraft((d) => ({ ...d, warrantyDaysDefault: e.target.value }))} style={{ width: 80 }} />
                    ) : (rt.warranty_days_default ? t('adminCatalog.daysShort', { days: String(rt.warranty_days_default) }) : '—')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {editId === rt.id ? (
                      <select className='input' value={String(editDraft.active ?? rt.active)} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.value === 'true' }))}>
                        <option value='true'>{t('adminCatalog.active')}</option>
                        <option value='false'>{t('adminCatalog.inactive')}</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: rt.active ? '#166534' : '#991b1b' }}>{rt.active ? t('adminCatalog.active') : t('adminCatalog.inactive')}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{rt.is_org_owned ? <CustomBadge /> : <GlobalBadge />}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    {rt.is_org_owned && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {editId === rt.id ? (
                          <>
                            <button className='button button-small' onClick={() => handleSaveEdit(rt.id)} disabled={saving} style={{ fontSize: 12 }}>{t('adminCatalog.save')}</button>
                            <button className='button button-small' onClick={() => setEditId(null)} style={{ fontSize: 12, background: '#f3f4f6', color: '#374151' }}>{t('adminCatalog.cancel')}</button>
                          </>
                        ) : deleteConfirmId === rt.id ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--danger, #dc2626)' }}>{t('adminCatalog.confirmDeleteRepairType')}</span>
                            <button className='button button-small' onClick={() => handleDelete(rt.id)} style={{ fontSize: 12, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{t('adminCatalog.confirmYes')}</button>
                            <button className='button button-small' onClick={() => setDeleteConfirmId(null)} style={{ fontSize: 12, background: '#f3f4f6', color: '#374151' }}>{t('adminCatalog.confirmNo')}</button>
                          </span>
                        ) : (
                          <>
                            <button className='button button-small' onClick={() => { setEditId(rt.id); setEditDraft({}) }} style={{ fontSize: 12 }}>{t('adminCatalog.edit')}</button>
                            <button className='button button-small' onClick={() => setDeleteConfirmId(rt.id)} style={{ fontSize: 12, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{t('adminCatalog.delete')}</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {repairTypes.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>{t('adminCatalog.noRepairTypesFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCatalogPage() {
  const t = useT()
  const [tab, setTab] = useState('brands')
  const TABS = [
    { key: 'brands', label: t('adminCatalog.tabBrands') },
    { key: 'models', label: t('adminCatalog.tabModels') },
    { key: 'repair-types', label: t('adminCatalog.tabRepairTypes') },
  ]

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('adminCatalog.kicker')}</div>
          <h1>{t('adminCatalog.heading')}</h1>
          <p>{t('adminCatalog.intro')}</p>
        </div>

        <div className='notice notice-warn' style={{ fontSize: 13 }}>
          {t('adminCatalog.globalCustomNotice')}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6 }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type='button'
              onClick={() => setTab(key)}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: '1px solid #ddd',
                background: tab === key ? '#111' : '#fff',
                color: tab === key ? '#fff' : '#555',
                fontWeight: tab === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'brands' && <BrandsTab />}
        {tab === 'models' && <ModelsTab />}
        {tab === 'repair-types' && <RepairTypesTab />}
      </div>
    </main>
  )
}
