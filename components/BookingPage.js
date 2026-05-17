'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useT } from '../lib/i18n/TranslationProvider'

const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#555' }

export default function BookingPage({ orgSlug, orgName, prefill }) {
  const t = useT()
  const [form, setForm] = useState(() => ({
    firstName: prefill?.firstName || '',
    lastName:  prefill?.lastName  || '',
    email:     prefill?.email     || '',
    phone:     prefill?.phone     || '',
    brandName: '', modelName: '', repairDescription: '', preferredAt: '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // useState initializer runs once on mount — avoids impure Date.now() on every render
  const [minDateStr] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000)
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
    return d.toISOString().slice(0, 16)
  })

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgSlug, ...form }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('booking.errors.submitFailed'))
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='info-card' style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h1 style={{ margin: '0 0 8px' }}>{t('booking.successHeading')}</h1>
            <p style={{ color: 'var(--muted)', maxWidth: 400, margin: '0 auto 24px' }}>
              {t('booking.successConfirmation', { email: form.email })}
            </p>
            <Link href={`/shop/${orgSlug}`} className='button button-secondary'>{t('booking.backToShop', { orgName })}</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{orgName}</div>
          <h1>{t('booking.pageTitle')}</h1>
          <p>{t('booking.pageDescription')}</p>
          {prefill?.email && (
            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
              {t('booking.bookingAs', { email: prefill.email })}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className='policy-card' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t('booking.firstNameRequired')}</label>
            <input style={inputStyle} value={form.firstName} onChange={set('firstName')} required placeholder={t('booking.firstNamePlaceholder')} />
          </div>
          <div>
            <label style={labelStyle}>{t('booking.lastName')}</label>
            <input style={inputStyle} value={form.lastName} onChange={set('lastName')} placeholder={t('booking.lastNamePlaceholder')} />
          </div>
          <div>
            <label style={labelStyle}>{t('booking.emailRequired')}</label>
            <input style={inputStyle} type='email' value={form.email} onChange={set('email')} required placeholder={t('booking.emailPlaceholder')} />
          </div>
          <div>
            <label style={labelStyle}>{t('booking.phone')}</label>
            <input style={inputStyle} type='tel' value={form.phone} onChange={set('phone')} placeholder={t('booking.phonePlaceholder')} />
          </div>
          <div>
            <label style={labelStyle}>{t('booking.deviceBrand')}</label>
            <input style={inputStyle} value={form.brandName} onChange={set('brandName')} placeholder={t('booking.brandPlaceholder')} />
          </div>
          <div>
            <label style={labelStyle}>{t('booking.deviceModel')}</label>
            <input style={inputStyle} value={form.modelName} onChange={set('modelName')} placeholder={t('booking.modelPlaceholder')} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('booking.repairLabel')}</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.repairDescription}
              onChange={set('repairDescription')}
              placeholder={t('booking.descriptionPlaceholder')}
              maxLength={1000}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('booking.preferredTimeRequired')}</label>
            <input
              style={inputStyle}
              type='datetime-local'
              value={form.preferredAt}
              onChange={set('preferredAt')}
              min={minDateStr}
              required
            />
          </div>

          {error && (
            <div style={{ gridColumn: '1 / -1', padding: '10px 14px', background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 6, color: '#b91c1c', fontSize: 14 }}>
              {error}
            </div>
          )}

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
            <button type='submit' className='button button-primary' disabled={saving}>
              {saving ? t('booking.submitting') : t('booking.submit')}
            </button>
            <Link href={`/shop/${orgSlug}`} className='button button-secondary'>{t('booking.cancel')}</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
