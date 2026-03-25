'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function FinalBalanceCompletePage({ quoteId }) {
  const searchParams = useSearchParams()
  const [state, setState] = useState('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')

    if (!paymentIntentId) {
      setState('error')
      setErrorMessage('Missing payment information. Please contact support.')
      return
    }

    if (redirectStatus === 'failed') {
      setState('failed')
      setErrorMessage('Your payment was not completed. Please try again.')
      return
    }

    fetch('/api/payments/final-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, quoteId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setState('success')
        } else {
          setErrorMessage(data.error || 'Unable to confirm payment.')
          setState('error')
        }
      })
      .catch(() => {
        setErrorMessage('Unable to confirm payment. Please contact support with your quote ID.')
        setState('error')
      })
  }, [searchParams, quoteId])

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        {state === 'verifying' ? (
          <div className='info-card'>
            <div className='kicker'>Please wait</div>
            <h1>Confirming your payment…</h1>
            <p>This will only take a moment.</p>
          </div>
        ) : null}

        {state === 'success' ? (
          <>
            <div className='info-card'>
              <div className='kicker'>Payment confirmed</div>
              <h1>Final balance received — thank you!</h1>
              <p>Your repair has been financially cleared and can now move toward final shipping.</p>
            </div>

            <div className='grid-2'>
              <div className='policy-card'>
                <div className='kicker'>Next step</div>
                <h3>Track return shipping progress</h3>
                <p>
                  Your tracking page will show the next updates as the repair moves into final shipment.
                </p>
                <div className='inline-actions' style={{ marginTop: 16 }}>
                  <Link href={`/track/${quoteId}`} className='button button-primary'>
                    Open Tracking Page
                  </Link>
                </div>
              </div>

              <div className='policy-card'>
                <div className='kicker'>Repair status</div>
                <h3>What happens now</h3>
                <div className='preview-meta' style={{ marginTop: 18 }}>
                  <div className='preview-meta-row'><span>1</span><span>Payment is marked complete.</span></div>
                  <div className='preview-meta-row'><span>2</span><span>Your order can move to ready-to-ship and outbound tracking.</span></div>
                  <div className='preview-meta-row'><span>3</span><span>You can follow all updates from the tracking page.</span></div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {state === 'failed' ? (
          <div className='policy-card'>
            <div className='kicker'>Payment not completed</div>
            <h3>Something went wrong</h3>
            <div className='notice' style={{ marginBottom: 16 }}>{errorMessage}</div>
            <div className='inline-actions'>
              <Link href={`/pay/${quoteId}/balance`} className='button button-primary'>
                Try Again
              </Link>
            </div>
          </div>
        ) : null}

        {state === 'error' ? (
          <div className='policy-card'>
            <div className='kicker'>Error</div>
            <h3>Unable to confirm payment</h3>
            <div className='notice' style={{ marginBottom: 16 }}>{errorMessage}</div>
            <p style={{ fontSize: 13, color: '#666' }}>
              Quote ID: <code>{quoteId}</code>
            </p>
            <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
              If you were charged and are seeing this message, please contact us with your quote ID and we will investigate.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  )
}
