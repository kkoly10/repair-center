'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

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

// Inner form component that uses Stripe hooks
function CheckoutForm({ quoteId, depositAmount, summary, email }) {
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
        return_url: `${window.location.origin}/pay/${quoteId}/complete`,
        receipt_email: email,
      },
    })

    // Only reached if there's an immediate error (redirect didn't happen)
    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='page-stack'>
      <div className='policy-card'>
        <div className='kicker'>Payment details</div>
        <h3>Pay inspection deposit</h3>
        <p style={{ marginBottom: 20 }}>
          Your card will be charged <strong>{fmt(depositAmount)}</strong>. This deposit will be credited toward your
          final repair bill.
        </p>
        <PaymentElement />
        {error ? (
          <div className='notice' style={{ marginTop: 16 }}>
            {error}
          </div>
        ) : null}
        <div className='inline-actions' style={{ marginTop: 20 }}>
          <button type='submit' className='button button-primary' disabled={!stripe || !elements || paying}>
            {paying ? 'Processing…' : `Pay ${fmt(depositAmount)} deposit`}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function PaymentCheckoutPage({ quoteId }) {
  const [state, setState] = useState('loading') // loading | ready | error | noDeposit
  const [clientSecret, setClientSecret] = useState(null)
  const [depositAmount, setDepositAmount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [email, setEmail] = useState('')
  const [inputEmail, setInputEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadIntent = useCallback(
    async (emailValue) => {
      setState('loading')
      setErrorMessage('')

      try {
        const response = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId, email: emailValue }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.error?.includes('No deposit is required')) {
            setState('noDeposit')
          } else if (data.error?.includes('already exists')) {
            setState('alreadyPaid')
          } else {
            setErrorMessage(data.error || 'Unable to load payment details.')
            setState('error')
          }
          return
        }

        setClientSecret(data.clientSecret)
        setDepositAmount(data.depositAmount)
        setSummary(data.summary)
        setEmail(emailValue)
        setState('ready')
      } catch {
        setErrorMessage('Unable to connect. Please try again.')
        setState('error')
      }
    },
    [quoteId]
  )

  const handleEmailSubmit = (event) => {
    event.preventDefault()
    if (inputEmail.trim()) loadIntent(inputEmail.trim().toLowerCase())
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Inspection deposit</div>
          <h1>Complete your deposit payment</h1>
          <p>
            An inspection deposit is required to begin the repair process. It will be credited toward your final
            repair bill once the work is complete.
          </p>
        </div>

        {state === 'loading' && !clientSecret ? (
          <div className='grid-2'>
            <form className='policy-card' onSubmit={handleEmailSubmit}>
              <div className='kicker'>Verify request</div>
              <h3>Enter your email</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='payment-email'>Email address used for this quote</label>
                <input
                  id='payment-email'
                  type='email'
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
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
              <h3>About inspection deposits</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>1</span><span>Pay the deposit to confirm your repair slot.</span></div>
                <div className='preview-meta-row'><span>2</span><span>Ship your device to us.</span></div>
                <div className='preview-meta-row'><span>3</span><span>Deposit is credited toward your final bill.</span></div>
              </div>
            </div>
          </div>
        ) : null}

        {state === 'error' ? (
          <div className='policy-card'>
            <div className='notice'>{errorMessage}</div>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <button
                type='button'
                className='button button-secondary'
                onClick={() => { setState('loading'); setClientSecret(null) }}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : null}

        {state === 'noDeposit' ? (
          <div className='policy-card'>
            <div className='kicker'>No payment needed</div>
            <h3>No deposit required</h3>
            <p>This repair does not require an upfront deposit. You can proceed directly to the mail-in instructions.</p>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <a href={`/mail-in/${quoteId}`} className='button button-primary'>View Mail-In Instructions</a>
            </div>
          </div>
        ) : null}

        {state === 'alreadyPaid' ? (
          <div className='policy-card'>
            <div className='kicker'>Deposit received</div>
            <h3>Payment already on file</h3>
            <p>Your deposit has already been received. Proceed to the mail-in instructions to ship your device.</p>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <a href={`/mail-in/${quoteId}`} className='button button-primary'>View Mail-In Instructions</a>
            </div>
          </div>
        ) : null}

        {state === 'ready' && clientSecret && summary ? (
          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>Order summary</div>
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
                  <span>{fmt(summary.estimateTotal)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span><strong>Deposit due today</strong></span>
                  <span><strong>{fmt(depositAmount)}</strong></span>
                </div>
              </div>
              <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
                The deposit will be credited toward your final repair bill.
              </p>
            </div>

            <Elements
              stripe={getStripePromise()}
              options={{
                clientSecret,
                appearance: { theme: 'stripe', variables: { colorPrimary: '#111111' } },
              }}
            >
              <CheckoutForm
                quoteId={quoteId}
                depositAmount={depositAmount}
                summary={summary}
                email={email}
              />
            </Elements>
          </div>
        ) : null}
      </div>
    </main>
  )
}
