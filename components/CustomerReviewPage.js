'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomerReviewPage({ quoteId, firstName, device, initialRating }) {
  const [selectedRating, setSelectedRating] = useState(initialRating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const autoSubmittedRef = useRef(false)

  useEffect(() => {
    if (initialRating && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      submitReview(initialRating, null, 'email_link')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function submitReview(rating, reviewComment, source = 'web') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/review/${quoteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: reviewComment, source }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setSubmitted(true)
          return
        }
        setError(json.error || 'Failed to submit review.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (selectedRating < 1) return
    submitReview(selectedRating, comment || null, 'web')
  }

  const displayRating = hoveredRating || selectedRating

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16, padding: '40px 32px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h1 style={{ margin: '0 0 12px', fontSize: '1.5rem', fontWeight: 700, color: '#111' }}>Thanks for your feedback!</h1>
          <p style={{ margin: 0, color: '#666', lineHeight: 1.6 }}>
            Your review helps us improve our service. We appreciate you taking the time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16, padding: '40px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#111' }}>
          How was your repair?
        </h1>
        <p style={{ margin: '0 0 28px', color: '#666', lineHeight: 1.6 }}>
          Hi {firstName}, we hope you&apos;re enjoying your repaired {device}. Tap a star to rate your experience.
        </p>

        <form onSubmit={handleManualSubmit}>
          {/* Star picker */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type='button'
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 40,
                  padding: 4,
                  color: star <= displayRating ? '#f59e0b' : '#d1d5db',
                  transition: 'color 0.1s, transform 0.1s',
                  transform: star <= displayRating ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                ★
              </button>
            ))}
          </div>

          {/* Comment */}
          {selectedRating > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                Tell us more (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder='What went well? Anything we can improve?'
                rows={3}
                maxLength={2000}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {error && (
            <p style={{ margin: '0 0 16px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>
          )}

          <button
            type='submit'
            disabled={selectedRating < 1 || loading}
            style={{
              width: '100%',
              padding: '12px',
              background: selectedRating >= 1 ? '#111' : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: selectedRating >= 1 ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
