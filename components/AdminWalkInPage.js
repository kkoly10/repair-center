'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminAuthGate from './AdminAuthGate'
import { useT } from '../lib/i18n/TranslationProvider'

const CATEGORY_KEYS = ['phone', 'tablet', 'laptop', 'other']

export default function AdminWalkInPage() {
  return (
    <AdminAuthGate>
      <WalkInWizard />
    </AdminAuthGate>
  )
}

function WalkInWizard() {
  const t = useT()
  const router = useRouter()
  const CATEGORIES = CATEGORY_KEYS.map((key) => ({ key, label: t(`adminWalkin.category_${key}`) }))
  const [step, setStep] = useState(1)

  // Step 1: customer
  const [customerQuery, setCustomerQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2: device + repair
  const [category, setCategory] = useState('phone')
  const [brandName, setBrandName] = useState('')
  const [modelName, setModelName] = useState('')
  const [repairDescription, setRepairDescription] = useState('')

  // Step 3: finalize
  const [agreedPrice, setAgreedPrice] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [techs, setTechs] = useState([])

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const debounceRef = useRef(null)

  // Debounced customer search — all setState deferred into setTimeout to satisfy lint rule
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (customerQuery.length < 2) { setSuggestions([]); return }
      setSearching(true)
      fetch(`/admin/api/customers?q=${encodeURIComponent(customerQuery)}`)
        .then(r => r.json())
        .then(json => { setSuggestions(json.customers || []) })
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false))
    }, customerQuery.length < 2 ? 0 : 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [customerQuery])

  // Load techs when reaching step 3
  useEffect(() => {
    if (step !== 3 || techs.length > 0) return
    fetch('/admin/api/team')
      .then(r => r.json())
      .then(json => { setTechs(json.members || []) })
      .catch(() => {})
  }, [step, techs.length])

  function selectExistingCustomer(c) {
    setSelectedCustomer(c)
    setIsNewCustomer(false)
    setFirstName(c.first_name || '')
    setLastName(c.last_name || '')
    setEmail(c.email || '')
    setPhone(c.phone || '')
    setSuggestions([])
    setCustomerQuery('')
  }

  function startNewCustomer() {
    setSelectedCustomer(null)
    setIsNewCustomer(true)
    setSuggestions([])
    setCustomerQuery('')
  }

  function step1Valid() {
    if (selectedCustomer) return true
    if (!isNewCustomer) return false
    return firstName.trim() && (phone.trim() || email.trim())
  }

  function step2Valid() {
    return repairDescription.trim().length > 0
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/admin/api/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          category,
          brandName: brandName.trim() || null,
          modelName: modelName.trim() || null,
          repairDescription: repairDescription.trim(),
          agreedPrice: agreedPrice || null,
          technicianId: technicianId || null,
          internalNotes: internalNotes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setSubmitError(json.error || t('adminWalkin.errorCreate')); return }
      router.push(`/admin/quotes/${json.quoteId}/order`)
    } catch {
      setSubmitError(t('adminWalkin.errorNetwork'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('adminWalkin.kicker')}</div>
          <h1>{t('adminWalkin.heading')}</h1>
          <p>{t('adminWalkin.intro')}</p>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                background: step === n ? 'var(--blue)' : step > n ? 'var(--blue-soft)' : 'var(--line)',
                color: step === n ? '#fff' : step > n ? 'var(--blue-strong)' : 'var(--muted)',
              }}
            >{n}</span>
          ))}
          <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 4 }}>
            {step === 1 ? t('adminWalkin.stepCustomer') : step === 2 ? t('adminWalkin.stepDevice') : t('adminWalkin.stepFinalize')}
          </span>
        </div>

        {/* ── Step 1: Customer ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className='info-card page-stack'>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t('adminWalkin.findOrAdd')}</h2>

            {!selectedCustomer && !isNewCustomer && (
              <>
                <input
                  type='text'
                  className='input'
                  placeholder={t('adminWalkin.searchPlaceholder')}
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  autoFocus
                />
                {searching && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('adminWalkin.searching')}</div>}
                {suggestions.length > 0 && (
                  <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    {suggestions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectExistingCustomer(c)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 14px', background: 'none', border: 'none',
                          borderBottom: '1px solid var(--line)', cursor: 'pointer',
                          fontSize: 14,
                        }}
                      >
                        <strong>{c.name}</strong>
                        <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 12 }}>
                          {c.phone || ''}{c.phone && c.email ? ' · ' : ''}{c.email || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <button className='button button-secondary' onClick={startNewCustomer}>
                  {t('adminWalkin.newCustomer')}
                </button>
              </>
            )}

            {selectedCustomer && (
              <div style={{ padding: '12px 14px', background: 'var(--blue-soft)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {selectedCustomer.phone || ''}{selectedCustomer.phone && selectedCustomer.email ? ' · ' : ''}{selectedCustomer.email || ''}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedCustomer(null); setIsNewCustomer(false) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}
                >{t('adminWalkin.change')}</button>
              </div>
            )}

            {isNewCustomer && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.firstNameRequired')}</label>
                  <input type='text' className='input' value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.lastName')}</label>
                  <input type='text' className='input' value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.phoneRequired')}</label>
                  <input type='tel' className='input' value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.email')}</label>
                  <input type='email' className='input' value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <button className='button button-ghost' style={{ fontSize: 13 }} onClick={() => setIsNewCustomer(false)}>{t('adminWalkin.backToSearch')}</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className='button'
                disabled={!step1Valid()}
                onClick={() => setStep(2)}
              >{t('adminWalkin.continue')}</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Device & Repair ───────────────────────────────────────── */}
        {step === 2 && (
          <div className='info-card page-stack'>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t('adminWalkin.deviceRepair')}</h2>

            {/* Category tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${category === cat.key ? 'var(--blue)' : 'var(--line)'}`,
                    background: category === cat.key ? 'var(--blue-soft)' : 'var(--surface)',
                    cursor: 'pointer',
                    fontWeight: category === cat.key ? 700 : 400,
                    fontSize: 13,
                    color: category === cat.key ? 'var(--blue-strong)' : 'var(--text)',
                    textAlign: 'center',
                  }}
                >{cat.label}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.brand')}</label>
                <input type='text' className='input' placeholder={t('adminWalkin.brandPlaceholder')} value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.model')}</label>
                <input type='text' className='input' placeholder={t('adminWalkin.modelPlaceholder')} value={modelName} onChange={(e) => setModelName(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.repairDescriptionRequired')}</label>
              <textarea
                className='input'
                rows={3}
                placeholder={t('adminWalkin.repairDescriptionPlaceholder')}
                value={repairDescription}
                onChange={(e) => setRepairDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className='button button-ghost' onClick={() => setStep(1)}>{t('adminWalkin.back')}</button>
              <button
                className='button'
                disabled={!step2Valid()}
                onClick={() => setStep(3)}
              >{t('adminWalkin.continue')}</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Finalize ──────────────────────────────────────────────── */}
        {step === 3 && (
          <div className='info-card page-stack'>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t('adminWalkin.finalizeOrder')}</h2>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.agreedPriceLabel')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, color: 'var(--muted)' }}>$</span>
                <input
                  type='number'
                  className='input'
                  min='0'
                  step='0.01'
                  placeholder='0.00'
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  style={{ maxWidth: 160 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.assignTechnician')}</label>
              <select
                className='input'
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                style={{ maxWidth: 300 }}
              >
                <option value=''>{t('adminWalkin.unassigned')}</option>
                {techs.map((tech) => (
                  <option key={tech.user_id} value={tech.user_id}>
                    {tech.full_name || tech.user_id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('adminWalkin.internalNotes')}</label>
              <textarea
                className='input'
                rows={3}
                placeholder={t('adminWalkin.internalNotesPlaceholder')}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Order summary */}
            <div style={{ padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('adminWalkin.orderSummary')}</div>
              <div style={{ color: 'var(--muted)' }}>
                <div>{firstName} {lastName}</div>
                <div>{[brandName, modelName].filter(Boolean).join(' ') || t(`adminWalkin.category_${category}`)} · {repairDescription}</div>
              </div>
            </div>

            {submitError && <div className='notice notice-error'>{submitError}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className='button button-ghost' onClick={() => setStep(2)}>{t('adminWalkin.back')}</button>
              <button
                className='button'
                disabled={submitting}
                onClick={handleSubmit}
              >{submitting ? t('adminWalkin.creating') : t('adminWalkin.createOrder')}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
