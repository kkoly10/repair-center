'use client'

import { useMemo, useState } from 'react'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import {
  CATEGORY_OPTIONS,
  formatPriceDisplay,
  getBrandsByCategory,
  getCatalogEntry,
  getModelsByBrandAndCategory,
  getPricingForSelection,
  getRepairsByModel,
} from '../lib/repairCatalog'

const categoryIcons = {
  phone: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  tablet: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  laptop: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
}

const popularEstimates = [
  { label: 'iPhone 14 Pro Screen', category: 'phone', brand: 'Apple', modelKey: 'iphone-14-pro', repairKey: 'screen' },
  { label: 'Galaxy S24 Ultra Battery', category: 'phone', brand: 'Samsung', modelKey: 'galaxy-s24-ultra', repairKey: 'battery' },
  { label: 'MacBook Air M2 Battery', category: 'laptop', brand: 'Apple', modelKey: 'macbook-air-m2-13', repairKey: 'battery' },
  { label: 'iPad 10th Gen Screen', category: 'tablet', brand: 'Apple', modelKey: 'ipad-10th-gen', repairKey: 'screen' },
  { label: 'Pixel 9 Screen', category: 'phone', brand: 'Google', modelKey: 'pixel-9', repairKey: 'screen' },
  { label: 'iPhone 13 Battery', category: 'phone', brand: 'Apple', modelKey: 'iphone-13', repairKey: 'battery' },
]

export default function InstantEstimator() {
  const t = useT()
  const [category, setCategory] = useState(null)
  const [brand, setBrand] = useState(null)
  const [modelKey, setModelKey] = useState(null)
  const [repairKey, setRepairKey] = useState(null)
  const [copied, setCopied] = useState(false)

  const brands = useMemo(() => (category ? getBrandsByCategory(category) : []), [category])

  const models = useMemo(() => {
    if (!category || !brand) return []
    return getModelsByBrandAndCategory(category, brand)
  }, [category, brand])

  const repairs = useMemo(() => (modelKey ? getRepairsByModel(modelKey) : []), [modelKey])

  const selectedRepair = useMemo(
    () => (modelKey && repairKey ? getPricingForSelection(modelKey, repairKey) : null),
    [modelKey, repairKey]
  )

  const entry = useMemo(() => (modelKey ? getCatalogEntry(modelKey) : null), [modelKey])

  const allSelected = category && brand && modelKey && repairKey && selectedRepair

  const estimateUrl = allSelected
    ? `/estimate?category=${encodeURIComponent(category)}&brand=${encodeURIComponent(brand)}&modelKey=${encodeURIComponent(modelKey)}&repairKey=${encodeURIComponent(repairKey)}`
    : '/estimate'

  const shareableUrl = allSelected
    ? `/instant-estimate?category=${encodeURIComponent(category)}&brand=${encodeURIComponent(brand)}&modelKey=${encodeURIComponent(modelKey)}&repairKey=${encodeURIComponent(repairKey)}`
    : null

  const onCategorySelect = (value) => {
    setCategory(value)
    setBrand(null)
    setModelKey(null)
    setRepairKey(null)
  }

  const onBrandSelect = (value) => {
    setBrand(value)
    setModelKey(null)
    setRepairKey(null)
  }

  const onModelSelect = (value) => {
    setModelKey(value)
    setRepairKey(null)
  }

  const onRepairSelect = (value) => {
    setRepairKey(value)
  }

  const applyPopularEstimate = (item) => {
    setCategory(item.category)
    setBrand(item.brand)
    setModelKey(item.modelKey)
    setRepairKey(item.repairKey)
  }

  const handleCopyLink = () => {
    if (!shareableUrl) return
    const fullUrl = typeof window !== 'undefined' ? window.location.origin + shareableUrl : shareableUrl
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main>
      <div className="page-hero">
        <div className="site-shell">
          <div className="page-stack">
            <div className="hero-copy" style={{ padding: 32 }}>
              <div className="eyebrow">{t('instantEstimate.kicker')}</div>
              <h1 style={{ maxWidth: '16ch', fontSize: 'clamp(2.3rem, 5vw, 3.7rem)' }}>
                {t('instantEstimate.title')}
              </h1>
              <p>{t('instantEstimate.body')}</p>
            </div>

            {/* Step 1: Category */}
            <div style={{ marginTop: 8 }}>
              <div className="kicker">{t('instantEstimate.step1')}</div>
              <div className="grid-4" style={{ marginTop: 12 }}>
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`feature-card${category === option.value ? ' feature-card-active' : ''}`}
                    onClick={() => onCategorySelect(option.value)}
                    style={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      border: category === option.value ? '2px solid var(--blue, #2563eb)' : '2px solid transparent',
                      background: category === option.value ? 'var(--surface-alt, #f0f4ff)' : undefined,
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>{categoryIcons[option.value]}</div>
                    <h3 style={{ margin: 0 }}>{option.label}</h3>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Brand */}
            {category && brands.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="kicker">{t('instantEstimate.step2')}</div>
                <div className="inline-actions" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                  {brands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`button ${brand === b ? 'button-primary' : 'button-secondary'} button-compact`}
                      onClick={() => onBrandSelect(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Model */}
            {brand && models.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="kicker">{t('instantEstimate.step3')}</div>
                <div className="field" style={{ marginTop: 12, maxWidth: 400 }}>
                  <select
                    value={modelKey || ''}
                    onChange={(e) => onModelSelect(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="" disabled>
                      {t('instantEstimate.chooseModel')}
                    </option>
                    {models.map((m) => (
                      <option key={m.modelKey} value={m.modelKey}>
                        {m.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Repair type */}
            {modelKey && repairs.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="kicker">{t('instantEstimate.step4')}</div>
                <div className="inline-actions" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                  {repairs.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      className={`button ${repairKey === r.key ? 'button-primary' : 'button-secondary'} button-compact`}
                      onClick={() => onRepairSelect(r.key)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Instant Estimate Result */}
            {allSelected && (
              <div className="preview-card" style={{ marginTop: 32 }}>
                <div className="kicker">{t('instantEstimate.resultKicker')}</div>
                <div className="preview-price" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  {formatPriceDisplay(selectedRepair)}
                </div>
                <p className="muted" style={{ marginTop: 4, marginBottom: 16 }}>
                  {entry ? `${entry.brand} ${entry.model}` : ''} &mdash; {selectedRepair.label}
                </p>

                <div className="preview-meta">
                  <div className="preview-meta-row">
                    <span>{t('instantEstimate.rowRepairCost')}</span>
                    <span>{formatPriceDisplay(selectedRepair)}</span>
                  </div>
                  <div className="preview-meta-row">
                    <span>{t('instantEstimate.rowDeposit')}</span>
                    <span>{selectedRepair.deposit ? `$${selectedRepair.deposit}` : t('instantEstimate.quotedLater')}</span>
                  </div>
                  <div className="preview-meta-row">
                    <span>{t('instantEstimate.rowReturnShipping')}</span>
                    <span>{selectedRepair.shipping ? `$${selectedRepair.shipping}` : t('instantEstimate.quotedLater')}</span>
                  </div>
                  <div className="preview-meta-row">
                    <span>{t('instantEstimate.rowTurnaround')}</span>
                    <span>{selectedRepair.turnaround ?? t('instantEstimate.afterReview')}</span>
                  </div>
                  <div className="preview-meta-row">
                    <span>{t('instantEstimate.rowWarranty')}</span>
                    <span>{t('instantEstimate.warrantyValue')}</span>
                  </div>
                </div>

                <div className="info-card" style={{ marginTop: 20 }}>
                  <div className="kicker">{t('instantEstimate.whatYouPayKicker')}</div>
                  <div className="preview-meta" style={{ marginTop: 8 }}>
                    <div className="preview-meta-row">
                      <span>{t('instantEstimate.rowDepositApplied')}</span>
                      <span>{selectedRepair.deposit ? `$${selectedRepair.deposit}` : '--'}</span>
                    </div>
                    <div className="preview-meta-row">
                      <span>{t('instantEstimate.rowRemainingBalance')}</span>
                      <span>
                        {selectedRepair.mode === 'fixed' && selectedRepair.deposit
                          ? `$${selectedRepair.price - selectedRepair.deposit}`
                          : selectedRepair.mode === 'range' && selectedRepair.deposit
                            ? `$${selectedRepair.min - selectedRepair.deposit}–$${selectedRepair.max - selectedRepair.deposit}`
                            : t('instantEstimate.afterInspection')}
                      </span>
                    </div>
                    <div className="preview-meta-row">
                      <span>{t('instantEstimate.rowReturnShipping')}</span>
                      <span>{selectedRepair.shipping ? `$${selectedRepair.shipping}` : '--'}</span>
                    </div>
                    <div className="preview-meta-row" style={{ fontWeight: 700 }}>
                      <span>{t('instantEstimate.rowEstimatedTotal')}</span>
                      <span>
                        {selectedRepair.mode === 'fixed' && selectedRepair.shipping
                          ? `$${(selectedRepair.price + selectedRepair.shipping).toFixed(2)}`
                          : selectedRepair.mode === 'range' && selectedRepair.shipping
                            ? `$${(selectedRepair.min + selectedRepair.shipping).toFixed(2)}–$${(selectedRepair.max + selectedRepair.shipping).toFixed(2)}`
                            : t('instantEstimate.afterInspection')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="inline-actions" style={{ marginTop: 24, flexWrap: 'wrap', gap: 10 }}>
                  <LocalizedLink href={estimateUrl} className="button button-primary">
                    {t('instantEstimate.proceedWithRepair')}
                  </LocalizedLink>
                  <LocalizedLink href={estimateUrl} className="button button-secondary">
                    {t('instantEstimate.detailedEstimate')}
                  </LocalizedLink>
                  <button
                    type="button"
                    className="button button-compact button-secondary"
                    onClick={handleCopyLink}
                  >
                    {copied ? t('instantEstimate.linkCopied') : t('instantEstimate.saveEstimate')}
                  </button>
                </div>
              </div>
            )}

            {/* Popular Estimates */}
            <div style={{ marginTop: 48 }}>
              <div className="kicker">{t('instantEstimate.popularKicker')}</div>
              <h2 style={{ marginTop: 4, marginBottom: 16 }}>{t('instantEstimate.popularTitle')}</h2>
              <div className="grid-4" style={{ gap: 16 }}>
                {popularEstimates.map((item) => {
                  const repair = getPricingForSelection(item.modelKey, item.repairKey)
                  return (
                    <button
                      key={`${item.modelKey}-${item.repairKey}`}
                      type="button"
                      className="feature-card"
                      onClick={() => applyPopularEstimate(item)}
                      style={{ cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span className="muted" style={{ fontSize: '0.82rem' }}>
                        {item.brand}
                      </span>
                      <h3 style={{ margin: '6px 0 4px' }}>{item.label}</h3>
                      <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--blue, #2563eb)' }}>
                        {repair ? formatPriceDisplay(repair) : '--'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
