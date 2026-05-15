'use client'

import { useState, useEffect, useRef } from 'react'

const TYPE_OPTIONS = [
  { value: 'bug', label: '🐛 Bug report', description: 'Something isn\'t working as expected' },
  { value: 'feature', label: '💡 Feature request', description: 'I\'d like to see something new or improved' },
  { value: 'general', label: '💬 General feedback', description: 'Anything else on your mind' },
]

export default function FeedbackPanel({ orgId, prefillEmail, onClose }) {
  const [type, setType] = useState('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(prefillEmail || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
          organizationId: orgId || null,
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

  const remaining = 1000 - message.length

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 200, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label='Submit feedback'
        style={{
          position: 'fixed', bottom: 0, right: 0,
          width: 'min(400px, 100vw)',
          maxHeight: '90vh',
          background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          borderLeft: '1px solid var(--line)',
          borderRadius: 'var(--radius-md) 0 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
          zIndex: 201,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Send feedback</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 22, padding: 0, lineHeight: 1 }}
            aria-label='Close feedback panel'
          >×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Thanks for your feedback!</div>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 24px' }}>
                We review every submission and use it to improve the product.
              </p>
              <button
                className='button button-secondary'
                onClick={onClose}
                style={{ fontSize: 13 }}
              >Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Type selector */}
              <fieldset style={{ border: 'none', padding: 0, margin: '0 0 20px' }}>
                <legend style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, display: 'block' }}>Type of feedback</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${type === opt.value ? 'var(--blue)' : 'var(--line)'}`,
                        background: type === opt.value ? 'var(--blue-soft, rgba(22,163,74,0.06))' : 'var(--surface)',
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
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{opt.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>{opt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Message */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>
                  Your message <span style={{ color: 'var(--danger, #dc2626)' }}>*</span>
                </label>
                <textarea
                  className='input'
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  placeholder='Describe the issue, idea, or feedback in detail…'
                  rows={5}
                  required
                  minLength={5}
                  style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 14 }}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: remaining < 50 ? 'var(--danger, #dc2626)' : 'var(--muted)', marginTop: 4 }}>
                  {remaining} characters remaining
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>
                  Your email <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--muted)' }}>(optional — for follow-up)</span>
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

              {error && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--danger, #dc2626)' }}>{error}</div>}

              <button
                type='submit'
                className='button button-primary'
                disabled={submitting || message.trim().length < 5}
                style={{ width: '100%' }}
              >
                {submitting ? 'Sending…' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
