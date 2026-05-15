'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import {
  formatPriceDisplay,
  getBrandsByCategory,
  getCatalogEntry,
  getModelsByBrandAndCategory,
  getPricingForSelection,
  getRepairsByModel,
} from '../lib/repairCatalog'

const DEVICE_TILE_KEYS = [
  { key: 'phone',  icon: '📱', labelKey: 'estimateForm.deviceTilePhone' },
  { key: 'tablet', icon: '⬛', labelKey: 'estimateForm.deviceTileTablet' },
  { key: 'laptop', icon: '💻', labelKey: 'estimateForm.deviceTileLaptop' },
  { key: 'other',  icon: '🔧', labelKey: 'estimateForm.deviceTileOther' },
]

const DEVICE_TO_CATEGORY = { phone: 'phone', tablet: 'tablet', laptop: 'laptop', other: 'other' }

const TOTAL_STEPS = 5

function ProgressBar({ step, t }) {
  return (
    <div className='form-progress-wrap'>
      <div className='form-progress'>
        <div className='form-progress-fill' style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
      <span className='form-progress-label'>{t('estimateForm.progressLabel', { step, total: TOTAL_STEPS })}</span>
    </div>
  )
}

export default function EstimateForm({ orgSlug, prefillContact }) {
  const t                = useT()
  const searchParams    = useSearchParams()
  const resolvedOrgSlug = orgSlug || searchParams.get('shop') || process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG || ''

  const [step,         setStep]         = useState(1)
  const [deviceType,   setDeviceType]   = useState(searchParams.get('category') || 'phone')
  const [brand,        setBrand]        = useState(searchParams.get('brand') || 'Apple')
  const [modelKey,     setModelKey]     = useState(searchParams.get('modelKey') || 'iphone-13')
  const [repairKey,    setRepairKey]    = useState(searchParams.get('repairKey') || 'screen')
  const [notes,        setNotes]        = useState('')
  const [selectedFiles,setSelectedFiles]= useState([])
  const [contact,      setContact]      = useState(() => ({
    firstName: prefillContact?.firstName || '',
    lastName:  prefillContact?.lastName  || '',
    email:     prefillContact?.email     || '',
    phone:     prefillContact?.phone     || '',
  }))
  const [phoneError,   setPhoneError]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [result,       setResult]       = useState(null)
  const [submitError,  setSubmitError]  = useState('')
  const [dbPricingLookup, setDbPricingLookup] = useState({})

  const previewUrls = useMemo(() => {
    const urls = selectedFiles.map((f) => URL.createObjectURL(f))
    return urls
  }, [selectedFiles])

  useEffect(() => {
    return () => { previewUrls.forEach((url) => URL.revokeObjectURL(url)) }
  }, [previewUrls])

  const didRestoreHash = useRef(false)

  useEffect(() => {
    if (!didRestoreHash.current) {
      didRestoreHash.current = true
      const match = window.location.hash.match(/^#step-([1-5])$/)
      if (match) {
        const hashStep = parseInt(match[1])
        setTimeout(() => setStep(hashStep), 0)
      }
    }
  }, [])

  useEffect(() => {
    window.location.hash = `step-${step}`
  }, [step])

  useEffect(() => {
    if (!resolvedOrgSlug) return
    fetch(`/api/pricing/${resolvedOrgSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.rules) return
        const lookup = {}
        for (const rule of data.rules) {
          const mk = rule.repair_catalog_models?.model_key
          const rk = rule.repair_types?.repair_key
          if (mk && rk) lookup[`${mk}:${rk}`] = rule
        }
        setDbPricingLookup(lookup)
      })
      .catch(() => {})
  }, [resolvedOrgSlug])

  const category = DEVICE_TO_CATEGORY[deviceType] || 'phone'
  const brands   = useMemo(() => getBrandsByCategory(category), [category])
  const models   = useMemo(() => {
    if (!brands.includes(brand)) return []
    return getModelsByBrandAndCategory(category, brand)
  }, [category, brand, brands])
  const repairs  = useMemo(() => getRepairsByModel(modelKey), [modelKey])

  const selectedRepair = useMemo(() => {
    const staticR = getPricingForSelection(modelKey, repairKey)
    const dbRule  = dbPricingLookup[`${modelKey}:${repairKey}`]
    if (!dbRule) return staticR
    return {
      ...staticR,
      price:   dbRule.public_price_fixed ?? staticR?.price ?? null,
      min:     dbRule.public_price_min   ?? staticR?.min   ?? null,
      max:     dbRule.public_price_max   ?? staticR?.max   ?? null,
      deposit: dbRule.deposit_amount     ?? staticR?.deposit ?? null,
    }
  }, [modelKey, repairKey, dbPricingLookup])

  const entry = useMemo(() => getCatalogEntry(modelKey), [modelKey])

  function cascadeFromDeviceType(type) {
    const cat       = DEVICE_TO_CATEGORY[type] || 'phone'
    const nextBrands = getBrandsByCategory(cat)
    const b          = nextBrands[0] ?? ''
    const nextModels = getModelsByBrandAndCategory(cat, b)
    const m          = nextModels[0]?.modelKey ?? ''
    const nextRepairs = getRepairsByModel(m)
    setBrand(b); setModelKey(m); setRepairKey(nextRepairs[0]?.key ?? '')
  }

  function cascadeFromBrand(b) {
    const nextModels  = getModelsByBrandAndCategory(category, b)
    const m            = nextModels[0]?.modelKey ?? ''
    const nextRepairs  = getRepairsByModel(m)
    setBrand(b); setModelKey(m); setRepairKey(nextRepairs[0]?.key ?? '')
  }

  function cascadeFromModel(m) {
    const nextRepairs = getRepairsByModel(m)
    setModelKey(m); setRepairKey(nextRepairs[0]?.key ?? '')
  }

  function tilePrice(rKey) {
    const s   = getPricingForSelection(modelKey, rKey)
    const db  = dbPricingLookup[`${modelKey}:${rKey}`]
    const fix = db?.public_price_fixed ?? s?.price
    const min = db?.public_price_min   ?? s?.min
    if (fix)  return `$${fix}`
    if (min)  return t('estimateForm.tilePriceFrom', { price: `$${min}` })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const phoneDigits = contact.phone.replace(/\D/g, '')
    if (contact.phone && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
      setPhoneError(t('estimateForm.errors.phoneInvalid'))
      return
    }
    setPhoneError('')
    setSubmitting(true); setSubmitError('')
    try {
      const fd = new FormData()
      fd.set('firstName',    contact.firstName)
      fd.set('lastName',     contact.lastName)
      fd.set('email',        contact.email)
      fd.set('phone',        contact.phone)
      fd.set('category',     category)
      fd.set('brand',        brand)
      fd.set('modelKey',     modelKey)
      fd.set('repairKey',    repairKey)
      fd.set('issueDescription', notes)
      if (resolvedOrgSlug) fd.set('orgSlug', resolvedOrgSlug)
      for (const f of selectedFiles) fd.append('photos', f)

      const res    = await fetch('/api/quote-requests', { method: 'POST', body: fd })
      const json   = await res.json()
      if (!res.ok) throw new Error(json.error || t('estimateForm.errors.submitFailed'))
      setResult(json)
      window.location.hash = ''
    } catch (err) {
      setSubmitError(err.message || t('estimateForm.errors.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const trackHref = resolvedOrgSlug
      ? `/shop/${resolvedOrgSlug}/track/${result.quoteId}`
      : `/track/${result.quoteId}`
    return (
      <div className='page-hero'>
        <div className='site-shell' style={{ maxWidth: 560, paddingTop: 48, paddingBottom: 64 }}>
          <div className='info-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
            <div className='kicker'>{t('estimateForm.successKicker')}</div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 8 }}>{t('estimateForm.successTitle')}</h1>
            <p style={{ color: 'var(--muted)', marginBottom: 4 }}>
              {t('estimateForm.successQuoteId')} <span className='id-mono' style={{ fontWeight: 700, color: 'var(--text)' }}>{result.quoteId}</span>
            </p>
            <p style={{ color: 'var(--muted)', margin: '0 0 28px' }}>{t('estimateForm.successText')}</p>

            <div className='steps-grid' style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
              {[
                { icon: '🔍', desc: t('estimateForm.successStep1') },
                { icon: '📋', desc: t('estimateForm.successStep2') },
                { icon: '🚀', desc: t('estimateForm.successStep3') },
              ].map(({ icon, desc }, i) => (
                <div key={i} className='step-tile' style={{ background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', padding: '16px 12px', alignItems: 'center', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className='inline-actions' style={{ justifyContent: 'center' }}>
              <LocalizedLink href={trackHref} className='button button-primary'>{t('estimateForm.successTrackButton')}</LocalizedLink>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='page-hero'>
      <div className='site-shell' style={{ maxWidth: 600, paddingTop: 40, paddingBottom: 64 }}>
        <ProgressBar step={step} t={t} />

        {step === 1 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>{t('estimateForm.kickerStep1')}</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>{t('estimateForm.step1Title')}</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>{t('estimateForm.step1Subtitle')}</p>
            </div>
            <div className='step-tiles-grid'>
              {DEVICE_TILE_KEYS.map(({ key, labelKey, icon }) => (
                <button
                  key={key}
                  type='button'
                  className={`device-tile${deviceType === key ? ' selected' : ''}`}
                  onClick={() => {
                    setDeviceType(key)
                    cascadeFromDeviceType(key)
                    setStep(2)
                  }}
                >
                  <span className='device-tile-icon'>{icon}</span>
                  <span className='device-tile-label'>{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>{t('estimateForm.kickerStep2')}</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>{t('estimateForm.step2Title')}</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>{t('estimateForm.step2Subtitle')}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className='field'>
                <label htmlFor='brand-sel'>{t('estimateForm.step2Brand')}</label>
                <select id='brand-sel' value={brand} onChange={(e) => cascadeFromBrand(e.target.value)}>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='model-sel'>{t('estimateForm.step2Model')}</label>
                <select id='model-sel' value={modelKey} onChange={(e) => cascadeFromModel(e.target.value)}>
                  {models.map((m) => <option key={m.modelKey} value={m.modelKey}>{m.model}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(1)}>{t('estimateForm.btnBack')}</button>
              <button type='button' className='button button-primary' onClick={() => setStep(3)} disabled={!modelKey}>
                {t('estimateForm.btnNextRepair')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>{t('estimateForm.kickerStep3')}</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>{t('estimateForm.step3Title')}</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                {entry
                  ? t('estimateForm.step3SubtitleForDevice', { device: `${entry.brand} ${entry.model}` })
                  : t('estimateForm.step3SubtitleGeneric')}
              </p>
            </div>
            <div className='step-tiles-grid' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {repairs.map(({ key, label }) => {
                const price = tilePrice(key)
                return (
                  <button
                    key={key}
                    type='button'
                    className={`device-tile${repairKey === key ? ' selected' : ''}`}
                    style={{ gap: 6, padding: '18px 12px' }}
                    onClick={() => { setRepairKey(key); setStep(4) }}
                  >
                    <span className='device-tile-label'>{label}</span>
                    {price && <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 400 }}>{price}</span>}
                  </button>
                )
              })}
            </div>
            {repairs.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('estimateForm.step3NoRepairs')}</p>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(2)}>{t('estimateForm.btnBack')}</button>
              {repairs.length === 0 && (
                <button type='button' className='button button-primary' onClick={() => setStep(4)}>{t('estimateForm.btnNextPhotos')}</button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>{t('estimateForm.kickerStep4')}</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>{t('estimateForm.step4Title')}</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>{t('estimateForm.step4Subtitle')}</p>
            </div>

            <div className='field'>
              <label htmlFor='photos-input'>
                {t('estimateForm.step4Photos')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t('estimateForm.step4PhotosOptional')}</span>
              </label>
              <input
                id='photos-input'
                type='file'
                accept='image/*'
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []).slice(0, 6))}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className='upload-grid'>
                {selectedFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className='upload-tile upload-tile-preview'>
                    <img src={previewUrls[i]} alt={f.name} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }} />
                    <span className='upload-tile-label'>{f.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className='field'>
              <label htmlFor='notes-input'>
                {t('estimateForm.step4Notes')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t('estimateForm.step4PhotosOptional')}</span>
              </label>
              <textarea
                id='notes-input'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('estimateForm.step4NotesPlaceholder')}
                style={{ minHeight: 90 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(3)}>{t('estimateForm.btnBack')}</button>
              <button type='button' className='button button-primary' onClick={() => setStep(5)}>{t('estimateForm.btnNextContact')}</button>
              <button type='button' style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0' }} onClick={() => setStep(5)}>
                {t('estimateForm.step4SkipForNow')}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <form onSubmit={handleSubmit} className='page-stack'>
            <div>
              <div className='kicker'>{t('estimateForm.kickerStep5')}</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>{t('estimateForm.step5Title')}</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                {prefillContact?.email
                  ? t('estimateForm.step5SubtitleSignedIn', { email: prefillContact.email })
                  : t('estimateForm.step5SubtitleAnon')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: entry ? `${entry.brand} ${entry.model}` : brand },
                { label: selectedRepair?.label || repairKey },
                { label: formatPriceDisplay(selectedRepair) },
              ].filter(({ label }) => label && label !== '—').map(({ label }) => (
                <span key={label} style={{ fontSize: '0.78rem', background: 'var(--bg-deep)', border: '1px solid var(--line)', borderRadius: 99, padding: '2px 10px', color: 'var(--muted)' }}>
                  {label}
                </span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className='field'>
                <label htmlFor='firstName'>{t('estimateForm.step5FirstName')}</label>
                <input id='firstName' type='text' value={contact.firstName} onChange={(e) => setContact((p) => ({ ...p, firstName: e.target.value }))} placeholder={t('estimateForm.step5FirstPlaceholder')} required />
              </div>
              <div className='field'>
                <label htmlFor='lastName'>{t('estimateForm.step5LastName')}</label>
                <input id='lastName' type='text' value={contact.lastName} onChange={(e) => setContact((p) => ({ ...p, lastName: e.target.value }))} placeholder={t('estimateForm.step5LastPlaceholder')} />
              </div>
              <div className='field' style={{ gridColumn: '1 / -1' }}>
                <label htmlFor='email'>{t('estimateForm.step5Email')}</label>
                <input id='email' type='email' value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} placeholder={t('estimateForm.step5EmailPlaceholder')} required />
              </div>
              <div className='field' style={{ gridColumn: '1 / -1' }}>
                <label htmlFor='phone'>
                  {t('estimateForm.step5Phone')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t('estimateForm.step4PhotosOptional')}</span>
                </label>
                <input
                  id='phone'
                  type='tel'
                  value={contact.phone}
                  onChange={(e) => { setContact((p) => ({ ...p, phone: e.target.value })); if (phoneError) setPhoneError('') }}
                  placeholder={t('estimateForm.step5PhonePlaceholder')}
                />
                {phoneError && <span style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>{phoneError}</span>}
              </div>
            </div>

            {submitError && <div className='notice notice-warn'>{submitError}</div>}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(4)}>{t('estimateForm.btnBack')}</button>
              <button type='submit' className='button button-primary' disabled={submitting}>
                {submitting ? t('estimateForm.submitting') : t('estimateForm.step5Submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
