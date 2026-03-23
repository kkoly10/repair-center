'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentCompletePage({ quoteId }) {
  const searchParams = useSearchParams()
  const [state, setState] = useState('verifying') // verifying | success | failed | error
  const [orderNumber, setOrderNumber] = useState(null)
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

    // Verify with our server and finalize the repair order
    fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, quoteId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setOrderNumber(data.orderNumber)
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
              <h1>Deposit received — thank you!</h1>
              <p>
                Your inspection deposit has been received and your repair order
                {orderNumber ? ` #${orderNumber}` : ''} is now active.
              </p>
            </div>

            <div className='grid-2'>
              <div className='policy-card'>
                <div className='kicker'>Next step</div>
                <h3>Ship your device</h3>
                <p>
                  Follow the mail-in instructions to package and send your device to us. Include your quote
                  ID <strong>{quoteId}</strong> inside the package.
                </p>
                <div className='inline-actions' style={{ marginTop: 16 }}>
                  <Link href={`/mail-in/${quoteId}`} className='button button-primary'>
                    View Mail-In Instructions
                  </Link>
                </div>
              </div>

              <div className='policy-card'>
                <div className='kicker'>Track your repair</div>
                <h3>Stay updated</h3>
                <p>
                  You can check the status of your repair at any time using your quote ID and email address.
                </p>
                <div className='inline-actions' style={{ marginTop: 16 }}>
                  <Link href={`/track/${quoteId}`} className='button button-secondary'>
                    Open Tracking Page
                  </Link>
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
              <Link href={`/pay/${quoteId}`} className='button button-primary'>
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
              If you were charged and are seeing this message, please contact us with your quote ID and we will
              look into it right away.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  )
}
