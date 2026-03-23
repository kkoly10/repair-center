'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TrackLookupPage() {
  const router = useRouter()
  const [quoteId, setQuoteId] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const normalized = quoteId.trim()
    if (!normalized) return
    router.push(`/track/${normalized}`)
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Track your repair</div>
          <h1>Enter your quote ID to continue</h1>
          <p>
            Use your quote ID to open the secure repair tracking page, then verify with
            the same email used for the estimate.
          </p>
        </div>

        <form className='policy-card center-card' onSubmit={handleSubmit}>
          <div className='field'>
            <label htmlFor='quote-id-lookup'>Quote ID</label>
            <input
              id='quote-id-lookup'
              value={quoteId}
              onChange={(event) => setQuoteId(event.target.value)}
              placeholder='RCQ-001000'
              required
            />
          </div>

          <div className='inline-actions'>
            <button type='submit' className='button button-primary'>
              Continue to Tracking
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}