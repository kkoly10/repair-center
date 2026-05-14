'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORY_OPTIONS,
  formatPriceDisplay,
  getBrandsByCategory,
  getCatalogEntry,
  getModelsByBrandAndCategory,
  getPricingForSelection,
  getRepairsByModel,
} from '../lib/repairCatalog'

const DEVICE_TILES = [
  { key: 'phone',  label: 'Phone',  icon: '📱' },
  { key: 'tablet', label: 'Tablet', icon: '⬛' },
  { key: 'laptop', label: 'Laptop', icon: '💻' },
  { key: 'other',  label: 'Other',  icon: '🔧' },
]

const DEVICE_TO_CATEGORY = { phone: 'phone', tablet: 'tablet', laptop: 'laptop', other: 'other' }

const TOTAL_STEPS = 5

function ProgressBar({ step }) {
  return (
    <div className='form-progress-wrap'>
      <div className='form-progress'>
        <div className='form-progress-fill' style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
      <span className='form-progress-label'>Step {step} of {TOTAL_STEPS}</span>
    </div>
  )
}

export default function EstimateForm({ orgSlug }) {
  const searchParams    = useSearchParams()
  const resolvedOrgSlug = orgSlug || searchParams.get('shop') || process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG || ''

  const [step,         setStep]         = useState(1)
  const [deviceType,   setDeviceType]   = useState(searchParams.get('category') || 'phone')
  const [brand,        setBrand]        = useState(searchParams.get('brand') || 'Apple')
  const [modelKey,     setModelKey]     = useState(searchParams.get('modelKey') || 'iphone-13')
  const [repairKey,    setRepairKey]    = useState(searchParams.get('repairKey') || 'screen')
  const [notes,        setNotes]        = useState('')
  const [selectedFiles,setSelectedFiles]= useState([])
  const [contact,      setContact]      = useState({ firstName: '', lastName: '', email: '', phone: '' })
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

  // Hash routing: restore step from hash on mount, sync hash on change
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

  // DB pricing
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
    if (min)  return `from $${min}`
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const phoneDigits = contact.phone.replace(/\D/g, '')
    if (contact.phone && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
      setPhoneError('Enter a valid phone number with at least 10 digits.')
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
      if (!res.ok) throw new Error(json.error || 'Unable to submit estimate request.')
      setResult(json)
      window.location.hash = ''
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    const trackHref = resolvedOrgSlug
      ? `/shop/${resolvedOrgSlug}/track/${result.quoteId}`
      : `/track/${result.quoteId}`
    return (
      <div className='page-hero'>
        <div className='site-shell' style={{ maxWidth: 560, paddingTop: 48, paddingBottom: 64 }}>
          <div className='info-card' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
            <div className='kicker'>Request received</div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 8 }}>You&apos;re all set!</h1>
            <p style={{ color: 'var(--muted)', marginBottom: 4 }}>
              Quote ID: <span className='id-mono' style={{ fontWeight: 700, color: 'var(--text)' }}>{result.quoteId}</span>
            </p>
            <p style={{ color: 'var(--muted)', margin: '0 0 28px' }}>We&apos;ll review your request and email you a detailed estimate, usually within one business day.</p>

            <div className='steps-grid' style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
              {[
                { icon: '🔍', step: '1', desc: 'We review your photos and device details' },
                { icon: '📋', step: '2', desc: 'We send you a detailed estimate by email' },
                { icon: '🚀', step: '3', desc: 'You approve and mail your device to us' },
              ].map(({ icon, step: s, desc }) => (
                <div key={s} className='step-tile' style={{ background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', padding: '16px 12px', alignItems: 'center', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className='inline-actions' style={{ justifyContent: 'center' }}>
              <Link href={trackHref} className='button button-primary'>Track my repair →</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Multi-step form ────────────────────────────────────────────────────────
  return (
    <div className='page-hero'>
      <div className='site-shell' style={{ maxWidth: 600, paddingTop: 40, paddingBottom: 64 }}>
        <ProgressBar step={step} />

        {/* ─ Step 1: Device type ─ */}
        {step === 1 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>Step 1 — Device</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>What type of device?</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>Select the device you need repaired to get started.</p>
            </div>
            <div className='step-tiles-grid'>
              {DEVICE_TILES.map(({ key, label, icon }) => (
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
                  <span className='device-tile-label'>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─ Step 2: Brand & Model ─ */}
        {step === 2 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>Step 2 — Device</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>Which brand and model?</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>Select your device brand and the exact model.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className='field'>
                <label htmlFor='brand-sel'>Brand</label>
                <select id='brand-sel' value={brand} onChange={(e) => cascadeFromBrand(e.target.value)}>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='model-sel'>Model</label>
                <select id='model-sel' value={modelKey} onChange={(e) => cascadeFromModel(e.target.value)}>
                  {models.map((m) => <option key={m.modelKey} value={m.modelKey}>{m.model}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(1)}>← Back</button>
              <button type='button' className='button button-primary' onClick={() => setStep(3)} disabled={!modelKey}>
                Next: Choose repair →
              </button>
            </div>
          </div>
        )}

        {/* ─ Step 3: Repair type ─ */}
        {step === 3 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>Step 3 — Repair</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>What needs fixing?</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                {entry ? `${entry.brand} ${entry.model}` : 'Your device'} — select the repair type.
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
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No repairs listed for this model — you can still submit and describe the issue.</p>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(2)}>← Back</button>
              {repairs.length === 0 && (
                <button type='button' className='button button-primary' onClick={() => setStep(4)}>Next: Photos →</button>
              )}
            </div>
          </div>
        )}

        {/* ─ Step 4: Photos & notes ─ */}
        {step === 4 && (
          <div className='page-stack'>
            <div>
              <div className='kicker'>Step 4 — Photos</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>Add photos &amp; notes</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                Clear photos help us give a more accurate estimate. Up to 6 images.
              </p>
            </div>

            <div className='field'>
              <label htmlFor='photos-input'>Photos <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
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
              <label htmlFor='notes-input'>Describe the issue <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                id='notes-input'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='What happened? What is not working? Any other details we should know.'
                style={{ minHeight: 90 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(3)}>← Back</button>
              <button type='button' className='button button-primary' onClick={() => setStep(5)}>Next: Your contact info →</button>
              <button type='button' style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0' }} onClick={() => setStep(5)}>
                Skip for now →
              </button>
            </div>
          </div>
        )}

        {/* ─ Step 5: Contact ─ */}
        {step === 5 && (
          <form onSubmit={handleSubmit} className='page-stack'>
            <div>
              <div className='kicker'>Step 5 — Contact</div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '4px 0 6px' }}>Where should we send the estimate?</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No account required. We&apos;ll email you the estimate within one business day.</p>
            </div>

            {/* Summary chip */}
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
                <label htmlFor='firstName'>First name</label>
                <input id='firstName' type='text' value={contact.firstName} onChange={(e) => setContact((p) => ({ ...p, firstName: e.target.value }))} placeholder='First' required />
              </div>
              <div className='field'>
                <label htmlFor='lastName'>Last name</label>
                <input id='lastName' type='text' value={contact.lastName} onChange={(e) => setContact((p) => ({ ...p, lastName: e.target.value }))} placeholder='Last' />
              </div>
              <div className='field' style={{ gridColumn: '1 / -1' }}>
                <label htmlFor='email'>Email address</label>
                <input id='email' type='email' value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} placeholder='name@example.com' required />
              </div>
              <div className='field' style={{ gridColumn: '1 / -1' }}>
                <label htmlFor='phone'>Phone number <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id='phone'
                  type='tel'
                  value={contact.phone}
                  onChange={(e) => { setContact((p) => ({ ...p, phone: e.target.value })); if (phoneError) setPhoneError('') }}
                  placeholder='(555) 555-5555'
                />
                {phoneError && <span style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>{phoneError}</span>}
              </div>
            </div>

            {submitError && <div className='notice notice-warn'>{submitError}</div>}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type='button' className='button button-secondary' onClick={() => setStep(4)}>← Back</button>
              <button type='submit' className='button button-primary' disabled={submitting}>
                {submitting ? 'Submitting…' : 'Get my estimate →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
