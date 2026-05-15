'use client'

import { useState } from 'react'

const TYPE_OPTIONS = [
  { value: 'bug', label: '🐛 Bug report', description: 'Something isn\'t working as expected' },
  { value: 'feature', label: '💡 Feature request', description: 'I\'d like to see something new or improved' },
  { value: 'general', label: '💬 General feedback', description: 'Anything else on your mind' },
]

export default function PublicFeedbackForm() {
  const [type, setType] = useState('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const remaining = 1000 - message.length

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          email: email.trim() || null,
          pageUrl: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to submit. Please try again.'); return }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🙏</div>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>Thank you!</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 24px' }}>
          We review every submission and use it to make the product better.
        </p>
        <button
          onClick={() => { setSubmitted(false); setMessage(''); setEmail(''); setType('general') }}
          className='button button-secondary'
        >Send more feedback</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '28px 24px' }}>

      {/* Type selector */}
      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 24px' }}>
        <legend style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12, display: 'block' }}>Type of feedback</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${type === opt.value ? 'var(--blue)' : 'var(--line)'}`,
                background: type === opt.value ? 'var(--blue-soft, rgba(22,163,74,0.05))' : 'var(--surface)',
                cursor: 'pointer', transition: 'border-color 0.12s',
              }}
            >
              <input
                type='radio'
                name='type'
                value={opt.value}
                checked={type === opt.value}
                onChange={() => setType(opt.value)}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${type === opt.value ? 'var(--blue)' : 'var(--line)'}`,
                  background: type === opt.value ? 'var(--blue)' : 'transparent',
                  flexShrink: 0, transition: 'all 0.12s',
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Message */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>
          Your message <span style={{ color: 'var(--danger, #dc2626)' }}>*</span>
        </label>
        <textarea
          className='input'
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
          placeholder='Be as detailed as you like — the more context, the better.'
          rows={6}
          required
          minLength={5}
          style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.95rem' }}
        />
        <div style={{ textAlign: 'right', fontSize: 12, color: remaining < 50 ? 'var(--danger, #dc2626)' : 'var(--muted)', marginTop: 4 }}>
          {remaining} / 1000
        </div>
      </div>

      {/* Email */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>
          Your email{' '}
          <span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'var(--muted)' }}>
            (optional — we&apos;ll only use this to follow up on your feedback)
          </span>
        </label>
        <input
          type='email'
          className='input'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='you@example.com'
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: 14, color: '#dc2626' }}>
          {error}
        </div>
      )}

      <button
        type='submit'
        className='button button-primary'
        disabled={submitting || message.trim().length < 5}
        style={{ width: '100%', fontSize: '1rem' }}
      >
        {submitting ? 'Sending…' : 'Send feedback'}
      </button>
    </form>
  )
}
