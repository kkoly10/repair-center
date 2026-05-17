'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
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

// Inner form component that uses Stripe hooks
function CheckoutForm({ quoteId, depositAmount, summary, email }) {
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
        return_url: `${window.location.origin}/pay/${quoteId}/complete`,
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
        <h3>{t('paymentCheckout.payDepositTitle')}</h3>
        <p style={{ marginBottom: 20 }}>{t('paymentCheckout.payDepositBody', { amount: fmt(depositAmount) })}</p>
        <PaymentElement />
        {error ? (
          <div className='notice' style={{ marginTop: 16 }}>
            {error}
          </div>
        ) : null}
        <div className='inline-actions' style={{ marginTop: 20 }}>
          <button type='submit' className='button button-primary' disabled={!stripe || !elements || paying}>
            {paying ? t('paymentCheckout.processing') : t('paymentCheckout.payDepositButton', { amount: fmt(depositAmount) })}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function PaymentCheckoutPage({ quoteId }) {
  const t = useT()
  const [state, setState] = useState('loading') // loading | ready | error | noDeposit | alreadyPaid
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
            setErrorMessage(data.error || t('paymentCheckout.unableLoadDetails'))
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
        setErrorMessage(t('paymentCheckout.unableConnect'))
        setState('error')
      }
    },
    [quoteId, t]
  )

  const handleEmailSubmit = (event) => {
    event.preventDefault()
    if (inputEmail.trim()) loadIntent(inputEmail.trim().toLowerCase())
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('paymentCheckout.depositKicker')}</div>
          <h1>{t('paymentCheckout.depositTitle')}</h1>
          <p>{t('paymentCheckout.depositBody')}</p>
        </div>

        {state === 'loading' && !clientSecret ? (
          <div className='grid-2'>
            <form className='policy-card' onSubmit={handleEmailSubmit}>
              <div className='kicker'>{t('paymentCheckout.verifyKicker')}</div>
              <h3>{t('paymentCheckout.enterEmailTitle')}</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='payment-email'>{t('paymentCheckout.emailLabel')}</label>
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
                  {t('paymentCheckout.continueToPayment')}
                </button>
              </div>
            </form>

            <div className='policy-card'>
              <div className='kicker'>{t('paymentCheckout.quoteNumberLabel', { quoteId })}</div>
              <h3>{t('paymentCheckout.aboutDepositsTitle')}</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>1</span><span>{t('paymentCheckout.aboutDeposit1')}</span></div>
                <div className='preview-meta-row'><span>2</span><span>{t('paymentCheckout.aboutDeposit2')}</span></div>
                <div className='preview-meta-row'><span>3</span><span>{t('paymentCheckout.aboutDeposit3')}</span></div>
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
                {t('paymentCheckout.tryAgain')}
              </button>
            </div>
          </div>
        ) : null}

        {state === 'noDeposit' ? (
          <div className='policy-card'>
            <div className='kicker'>{t('paymentCheckout.noPaymentKicker')}</div>
            <h3>{t('paymentCheckout.noPaymentTitle')}</h3>
            <p>{t('paymentCheckout.noPaymentBody')}</p>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <Link href={`/mail-in/${quoteId}`} className='button button-primary'>{t('paymentCheckout.viewMailIn')}</Link>
            </div>
          </div>
        ) : null}

        {state === 'alreadyPaid' ? (
          <div className='policy-card'>
            <div className='kicker'>{t('paymentCheckout.alreadyPaidKicker')}</div>
            <h3>{t('paymentCheckout.alreadyPaidTitle')}</h3>
            <p>{t('paymentCheckout.alreadyPaidBody')}</p>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <Link href={`/mail-in/${quoteId}`} className='button button-primary'>{t('paymentCheckout.viewMailIn')}</Link>
            </div>
          </div>
        ) : null}

        {state === 'ready' && clientSecret && summary ? (
          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>{t('paymentCheckout.orderSummaryKicker')}</div>
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
                  <span>{fmt(summary.estimateTotal)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span><strong>{t('paymentCheckout.depositDueToday')}</strong></span>
                  <span><strong>{fmt(depositAmount)}</strong></span>
                </div>
              </div>
              <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
                {t('paymentCheckout.depositCreditedNote')}
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
