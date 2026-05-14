'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack' style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className='kicker'>Error</div>
        <h1>Something went wrong</h1>
        <p style={{ color: 'var(--text-muted, #666)', maxWidth: 480, margin: '0 auto 2rem' }}>
          An unexpected error occurred. Please try again.
        </p>
        <div className='inline-actions' style={{ justifyContent: 'center' }}>
          <button className='button button-primary' onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </main>
  )
}
