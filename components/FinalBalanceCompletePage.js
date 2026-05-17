'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function FinalBalanceCompletePage({ quoteId }) {
  const t = useT()
  const searchParams = useSearchParams()
  const [state, setState] = useState('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function run() {
      const paymentIntentId = searchParams.get('payment_intent')
      const redirectStatus = searchParams.get('redirect_status')

      if (!paymentIntentId) {
        setState('error')
        setErrorMessage(t('paymentCheckout.missingPayInfo'))
        return
      }

      if (redirectStatus === 'failed') {
        setState('failed')
        setErrorMessage(t('paymentCheckout.paymentFailedMsg'))
        return
      }

      try {
        const res = await fetch('/api/payments/final-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId, quoteId }),
        })
        const data = await res.json()
        if (data.ok) {
          setState('success')
        } else {
          setErrorMessage(data.error || t('paymentCheckout.unableConfirm'))
          setState('error')
        }
      } catch {
        setErrorMessage(t('paymentCheckout.unableConfirmFull'))
        setState('error')
      }
    }
    run()
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
              <h1>{t('paymentCheckout.successBalanceTitle')}</h1>
              <p>{t('paymentCheckout.successBalanceBody')}</p>
            </div>

            <div className='grid-2'>
              <div className='policy-card'>
                <div className='kicker'>{t('paymentCheckout.nextStepKicker')}</div>
                <h3>{t('paymentCheckout.trackReturnTitle')}</h3>
                <p>{t('paymentCheckout.trackReturnBody')}</p>
                <div className='inline-actions' style={{ marginTop: 16 }}>
                  <LocalizedLink href={`/track/${quoteId}`} className='button button-primary'>
                    {t('paymentCheckout.openTracking')}
                  </LocalizedLink>
                </div>
              </div>

              <div className='policy-card'>
                <div className='kicker'>{t('paymentCheckout.repairStatusKicker')}</div>
                <h3>{t('paymentCheckout.whatHappensNow')}</h3>
                <div className='preview-meta' style={{ marginTop: 18 }}>
                  <div className='preview-meta-row'><span>1</span><span>{t('paymentCheckout.whatHappens1')}</span></div>
                  <div className='preview-meta-row'><span>2</span><span>{t('paymentCheckout.whatHappens2')}</span></div>
                  <div className='preview-meta-row'><span>3</span><span>{t('paymentCheckout.whatHappens3')}</span></div>
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
              <LocalizedLink href={`/pay/${quoteId}/balance`} className='button button-primary'>
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
              {t('paymentCheckout.errorContactNoteAlt')}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  )
}
