'use client'

import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useT } from '../lib/i18n/TranslationProvider'

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
  const t = useT()
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
      setError(stripeError.message || t('paymentCheckout.genericPaymentError'))
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='page-stack'>
      <div className='policy-card'>
        <div className='kicker'>{t('paymentCheckout.paymentDetailsKicker')}</div>
        <h3>{t('paymentCheckout.payBalanceTitle')}</h3>
        <p style={{ marginBottom: 20 }}>
          {t('paymentCheckout.payBalanceBody', { amount: fmt(finalBalanceDue) })}
        </p>
        <PaymentElement />
        {error ? <div className='notice' style={{ marginTop: 16 }}>{error}</div> : null}
        <div className='inline-actions' style={{ marginTop: 20 }}>
          <button type='submit' className='button button-primary' disabled={!stripe || !elements || paying}>
            {paying ? t('paymentCheckout.processing') : t('paymentCheckout.payBalanceButton', { amount: fmt(finalBalanceDue) })}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function FinalBalanceCheckoutPage({ quoteId }) {
  const t = useT()
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
        setErrorMessage(summaryData.error || t('paymentCheckout.unableLoadSummary'))
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
        setErrorMessage(intentData.error || t('paymentCheckout.unableCreateIntent'))
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
      setErrorMessage(t('paymentCheckout.unableConnect'))
      setState('error')
    }
  }, [quoteId, t])

  const handleEmailSubmit = (event) => {
    event.preventDefault()
    if (inputEmail.trim()) loadBalanceIntent(inputEmail.trim().toLowerCase())
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('paymentCheckout.balanceKicker')}</div>
          <h1>{t('paymentCheckout.balanceTitle')}</h1>
          <p>{t('paymentCheckout.balanceBody')}</p>
        </div>

        {state === 'verify' ? (
          <div className='grid-2'>
            <form className='policy-card' onSubmit={handleEmailSubmit}>
              <div className='kicker'>{t('paymentCheckout.verifyKicker')}</div>
              <h3>{t('paymentCheckout.enterEmailTitle')}</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='balance-email'>{t('paymentCheckout.emailLabel')}</label>
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
                  {t('paymentCheckout.continueToPayment')}
                </button>
              </div>
            </form>

            <div className='policy-card'>
              <div className='kicker'>{t('paymentCheckout.quoteNumberLabel', { quoteId })}</div>
              <h3>{t('paymentCheckout.whenCollectedTitle')}</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>1</span><span>{t('paymentCheckout.whenCollected1')}</span></div>
                <div className='preview-meta-row'><span>2</span><span>{t('paymentCheckout.whenCollected2')}</span></div>
                <div className='preview-meta-row'><span>3</span><span>{t('paymentCheckout.whenCollected3')}</span></div>
              </div>
            </div>
          </div>
        ) : null}

        {state === 'loading' ? (
          <div className='policy-card center-card'>{t('paymentCheckout.loadingPayment')}</div>
        ) : null}

        {state === 'error' ? (
          <div className='policy-card'>
            <div className='notice'>{errorMessage}</div>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <button type='button' className='button button-secondary' onClick={() => setState('verify')}>
                {t('paymentCheckout.tryAgain')}
              </button>
            </div>
          </div>
        ) : null}

        {state === 'noBalance' ? (
          <div className='policy-card'>
            <div className='kicker'>{t('paymentCheckout.noBalanceKicker')}</div>
            <h3>{t('paymentCheckout.noBalanceTitle')}</h3>
            <p>{t('paymentCheckout.noBalanceBody')}</p>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <a href={`/track/${quoteId}`} className='button button-primary'>{t('paymentCheckout.openTracking')}</a>
            </div>
          </div>
        ) : null}

        {state === 'ready' && clientSecret && summary ? (
          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>{t('paymentCheckout.balanceSummaryKicker')}</div>
              <h3>{summary.device || t('paymentCheckout.yourDevice')}</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                {summary.repair ? (
                  <div className='preview-meta-row'>
                    <span>{t('paymentCheckout.repairLabel')}</span>
                    <span>{summary.repair}</span>
                  </div>
                ) : null}
                <div className='preview-meta-row'>
                  <span>{t('paymentCheckout.estimateTotal')}</span>
                  <span>{fmt(summary.summary.estimateTotal)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span>{t('paymentCheckout.totalPaidSoFar')}</span>
                  <span>{fmt(summary.summary.totalCollected)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span><strong>{t('paymentCheckout.balanceDueNow')}</strong></span>
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
