'use client'
import { useState } from 'react'

const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#555' }

export default function BookingPage({ orgSlug, orgName }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    brandName: '', modelName: '', repairDescription: '', preferredAt: '',
  })
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
      if (!res.ok) throw new Error(json.error || 'Failed to book appointment.')
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
            <h1 style={{ margin: '0 0 8px' }}>Request Received!</h1>
            <p style={{ color: 'var(--muted)', maxWidth: 400, margin: '0 auto 24px' }}>
              We&apos;ll review your request and send a confirmation email to <strong>{form.email}</strong> shortly.
            </p>
            <a href={`/shop/${orgSlug}`} className='button button-secondary'>Back to {orgName}</a>
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
          <h1>Book a Drop-Off Appointment</h1>
          <p>Request a time to drop off your device. We&apos;ll confirm your appointment by email.</p>
        </div>

        <form onSubmit={handleSubmit} className='policy-card' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <label style={labelStyle}>First name *</label>
            <input style={inputStyle} value={form.firstName} onChange={set('firstName')} required placeholder='Jane' />
          </div>
          <div>
            <label style={labelStyle}>Last name</label>
            <input style={inputStyle} value={form.lastName} onChange={set('lastName')} placeholder='Smith' />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type='email' value={form.email} onChange={set('email')} required placeholder='jane@example.com' />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} type='tel' value={form.phone} onChange={set('phone')} placeholder='(555) 000-0000' />
          </div>
          <div>
            <label style={labelStyle}>Device brand</label>
            <input style={inputStyle} value={form.brandName} onChange={set('brandName')} placeholder='Apple, Samsung…' />
          </div>
          <div>
            <label style={labelStyle}>Device model</label>
            <input style={inputStyle} value={form.modelName} onChange={set('modelName')} placeholder='iPhone 15, Galaxy S24…' />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>What needs to be repaired?</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.repairDescription}
              onChange={set('repairDescription')}
              placeholder='Cracked screen, battery not charging, water damage…'
              maxLength={1000}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Preferred drop-off time *</label>
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
              {saving ? 'Submitting…' : 'Request Appointment'}
            </button>
            <a href={`/shop/${orgSlug}`} className='button button-secondary'>Cancel</a>
          </div>
        </form>
      </div>
    </main>
  )
}
