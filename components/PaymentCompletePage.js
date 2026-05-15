'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function PaymentCompletePage({ quoteId }) {
  const t = useT()
  const searchParams = useSearchParams()
  const [state, setState] = useState('verifying') // verifying | success | failed | error
  const [orderNumber, setOrderNumber] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')

    if (!paymentIntentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState('error')
      setErrorMessage(t('paymentCheckout.missingPayInfo'))
      return
    }

    if (redirectStatus === 'failed') {
      setState('failed')
      setErrorMessage(t('paymentCheckout.paymentFailedMsg'))
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
          setErrorMessage(data.error || t('paymentCheckout.unableConfirm'))
          setState('error')
        }
      })
      .catch(() => {
        setErrorMessage(t('paymentCheckout.unableConfirmFull'))
        setState('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, quoteId])

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        {state === 'verifying' ? (
          <div className='info-card'>
            <div className='kicker'>{t('paymentCheckout.verifyingKicker')}</div>
            <h1>{t('paymentCheckout.verifyingTitle')}</h1>
            <p>{t('paymentCheckout.verifyingBody')}</p>
          </div>
        ) : null}

        {state === 'success' ? (
          <>
            <div className='info-card'>
              <div className='kicker'>{t('paymentCheckout.successDepositKicker')}</div>
              <h1>{t('paymentCheckout.successDepositTitle')}</h1>
              <p>
                {t('paymentCheckout.successDepositBody', { orderNumber: orderNumber ? ` #${orderNumber}` : '' })}
              </p>
            </div>

            <div className='grid-2'>
              <div className='policy-card'>
                <div className='kicker'>{t('paymentCheckout.nextStepKicker')}</div>
                <h3>{t('paymentCheckout.shipDeviceTitle')}</h3>
                <p>{t('paymentCheckout.shipDeviceBody', { quoteId })}</p>
                <div className='inline-actions' style={{ marginTop: 16 }}>
                  <LocalizedLink href={`/mail-in/${quoteId}`} className='button button-primary'>
                    {t('paymentCheckout.viewMailInLong')}
                  </LocalizedLink>
                </div>
              </div>

              <div className='policy-card'>
                <div className='kicker'>{t('paymentCheckout.trackKicker')}</div>
                <h3>{t('paymentCheckout.trackTitle')}</h3>
                <p>{t('paymentCheckout.trackBody')}</p>
                <div className='inline-actions' style={{ marginTop: 16 }}>
                  <LocalizedLink href={`/track/${quoteId}`} className='button button-secondary'>
                    {t('paymentCheckout.openTracking')}
                  </LocalizedLink>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {state === 'failed' ? (
          <div className='policy-card'>
            <div className='kicker'>{t('paymentCheckout.paymentFailedKicker')}</div>
            <h3>{t('paymentCheckout.paymentFailedTitle')}</h3>
            <div className='notice' style={{ marginBottom: 16 }}>{errorMessage}</div>
            <div className='inline-actions'>
              <LocalizedLink href={`/pay/${quoteId}`} className='button button-primary'>
                {t('paymentCheckout.paymentFailedRetry')}
              </LocalizedLink>
            </div>
          </div>
        ) : null}

        {state === 'error' ? (
          <div className='policy-card'>
            <div className='kicker'>{t('paymentCheckout.errorKicker')}</div>
            <h3>{t('paymentCheckout.errorTitle')}</h3>
            <div className='notice' style={{ marginBottom: 16 }}>{errorMessage}</div>
            <p style={{ fontSize: 13, color: '#666' }}>
              {t('paymentCheckout.errorQuoteIdLabel')} <code>{quoteId}</code>
            </p>
            <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
              {t('paymentCheckout.errorContactNote')}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  )
}
