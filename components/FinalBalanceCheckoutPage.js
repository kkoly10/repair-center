'use client'

import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

let stripePromise = null
function getStripePromise() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

function fmt(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function BalanceCheckoutForm({ quoteId, email, finalBalanceDue }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay/${quoteId}/balance/complete`,
        receipt_email: email,
      },
    })

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='page-stack'>
      <div className='policy-card'>
        <div className='kicker'>Payment details</div>
        <h3>Pay remaining balance</h3>
        <p style={{ marginBottom: 20 }}>
          Your card will be charged <strong>{fmt(finalBalanceDue)}</strong>. Once payment is confirmed,
          the repair can move to final shipping.
        </p>
        <PaymentElement />
        {error ? <div className='notice' style={{ marginTop: 16 }}>{error}</div> : null}
        <div className='inline-actions' style={{ marginTop: 20 }}>
          <button type='submit' className='button button-primary' disabled={!stripe || !elements || paying}>
            {paying ? 'Processing…' : `Pay ${fmt(finalBalanceDue)} balance`}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function FinalBalanceCheckoutPage({ quoteId }) {
  const [state, setState] = useState('verify') // verify | loading | ready | error | noBalance
  const [clientSecret, setClientSecret] = useState(null)
  const [summary, setSummary] = useState(null)
  const [email, setEmail] = useState('')
  const [inputEmail, setInputEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadBalanceIntent = useCallback(async (emailValue) => {
    setState('loading')
    setErrorMessage('')

    try {
      const summaryResponse = await fetch('/api/payments/final-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, email: emailValue }),
      })
      const summaryData = await summaryResponse.json()

      if (!summaryResponse.ok) {
        setErrorMessage(summaryData.error || 'Unable to load payment summary.')
        setState(summaryData.error?.includes('No balance is due') ? 'noBalance' : 'error')
        return
      }

      const intentResponse = await fetch('/api/payments/final-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, email: emailValue }),
      })
      const intentData = await intentResponse.json()

      if (!intentResponse.ok) {
        setErrorMessage(intentData.error || 'Unable to create payment intent.')
        setState(intentData.error?.includes('No balance is due') ? 'noBalance' : 'error')
        return
      }

      setClientSecret(intentData.clientSecret)
      setSummary({
        ...summaryData,
        finalBalanceDue: intentData.finalBalanceDue,
        intentSummary: intentData.summary,
      })
      setEmail(emailValue)
      setState('ready')
    } catch {
      setErrorMessage('Unable to connect. Please try again.')
      setState('error')
    }
  }, [quoteId])

  const handleEmailSubmit = (event) => {
    event.preventDefault()
    if (inputEmail.trim()) loadBalanceIntent(inputEmail.trim().toLowerCase())
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Final balance</div>
          <h1>Complete your remaining payment</h1>
          <p>
            Once the final balance is paid, the repair can move into final shipping and return delivery.
          </p>
        </div>

        {state === 'verify' ? (
          <div className='grid-2'>
            <form className='policy-card' onSubmit={handleEmailSubmit}>
              <div className='kicker'>Verify request</div>
              <h3>Enter your email</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='balance-email'>Email address used for this quote</label>
                <input
                  id='balance-email'
                  type='email'
                  value={inputEmail}
                  onChange={(event) => setInputEmail(event.target.value)}
                  placeholder='name@example.com'
                  required
                />
              </div>
              {errorMessage ? <div className='notice' style={{ marginTop: 16 }}>{errorMessage}</div> : null}
              <div className='inline-actions'>
                <button type='submit' className='button button-primary'>
                  Continue to Payment
                </button>
              </div>
            </form>

            <div className='policy-card'>
              <div className='kicker'>Quote #{quoteId}</div>
              <h3>When final balance is collected</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>1</span><span>The repair is marked financially cleared.</span></div>
                <div className='preview-meta-row'><span>2</span><span>Your order can move to final shipping.</span></div>
                <div className='preview-meta-row'><span>3</span><span>You can keep tracking progress from your repair page.</span></div>
              </div>
            </div>
          </div>
        ) : null}

        {state === 'loading' ? (
          <div className='policy-card center-card'>Loading payment details…</div>
        ) : null}

        {state === 'error' ? (
          <div className='policy-card'>
            <div className='notice'>{errorMessage}</div>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <button type='button' className='button button-secondary' onClick={() => setState('verify')}>
                Try Again
              </button>
            </div>
          </div>
        ) : null}

        {state === 'noBalance' ? (
          <div className='policy-card'>
            <div className='kicker'>No balance due</div>
            <h3>This repair does not need another payment</h3>
            <p>Your order already appears fully paid. You can return to your tracking page.</p>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <a href={`/track/${quoteId}`} className='button button-primary'>Open Tracking Page</a>
            </div>
          </div>
        ) : null}

        {state === 'ready' && clientSecret && summary ? (
          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>Balance summary</div>
              <h3>{summary.device || 'Your device'}</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                {summary.repair ? (
                  <div className='preview-meta-row'>
                    <span>Repair</span>
                    <span>{summary.repair}</span>
                  </div>
                ) : null}
                <div className='preview-meta-row'>
                  <span>Estimate total</span>
                  <span>{fmt(summary.summary.estimateTotal)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span>Total paid so far</span>
                  <span>{fmt(summary.summary.totalCollected)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span><strong>Balance due now</strong></span>
                  <span><strong>{fmt(summary.summary.finalBalanceDue)}</strong></span>
                </div>
              </div>
            </div>

            <Elements
              stripe={getStripePromise()}
              options={{
                clientSecret,
                appearance: { theme: 'stripe', variables: { colorPrimary: '#111111' } },
              }}
            >
              <BalanceCheckoutForm quoteId={quoteId} email={email} finalBalanceDue={summary.summary.finalBalanceDue} />
            </Elements>
          </div>
        ) : null}
      </div>
    </main>
  )
}
