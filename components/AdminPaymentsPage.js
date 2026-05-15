'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import AdminPaymentSummaryCard from './AdminPaymentSummaryCard'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminPaymentsPage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminPaymentsInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function AdminPaymentsInner({ quoteId }) {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentData, setPaymentData] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, {
          cache: 'no-store',
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || t('adminPayments.loadFailed'))
        if (!ignore) setPaymentData(result)
      } catch (err) {
        if (!ignore) setError(err.message || t('adminPayments.loadFailed'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [quoteId, t])

  const handleRequestFinalBalance = async () => {
    setRequesting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/admin/api/quotes/${quoteId}/request-final-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t('adminPayments.requestFailed'))

      setSuccess(
        result.amountDue > 0
          ? t('adminPayments.successWithAmount', { amount: Number(result.amountDue).toFixed(2) })
          : t('adminPayments.successSimple')
      )

      const refreshResponse = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, {
        cache: 'no-store',
      })
      const refreshResult = await refreshResponse.json()
      if (refreshResponse.ok) setPaymentData(refreshResult)
    } catch (err) {
      setError(err.message || t('adminPayments.requestFailed'))
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>{t('adminPayments.loading')}</div>
        </div>
      </main>
    )
  }

  if (error && !paymentData) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>{t('adminPayments.headingUnableToOpen')}</h1>
            <p>{error}</p>
            <div className='inline-actions'>
              <LocalizedLink href={`/admin/quotes/${quoteId}`} className='button button-secondary'>
                {t('adminPayments.backToQuote')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const summary = paymentData?.summary || {}
  const orderNumber = paymentData?.repairOrder?.order_number || t('adminPayments.orderPending')

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='quote-card'>
          <div className='quote-top'>
            <div>
              <div className='quote-id'>{paymentData?.quote?.quote_id}</div>
              <h1 className='quote-title'>{t('adminPayments.title', { order: orderNumber })}</h1>
              <p className='muted'>
                {[paymentData?.quote?.brand_name, paymentData?.quote?.model_name].filter(Boolean).join(' ')} ·{' '}
                {paymentData?.quote?.repair_type_key || t('adminPayments.repairTypeNotSet')}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <LocalizedLink href={`/admin/quotes/${quoteId}`} className='button button-secondary button-compact'>
              {t('adminPayments.backToQuote')}
            </LocalizedLink>
            <LocalizedLink href={`/admin/quotes/${quoteId}/order`} className='button button-secondary button-compact'>
              {t('adminPayments.backToRepairOrder')}
            </LocalizedLink>
            <LocalizedLink href={`/track/${quoteId}`} className='button button-secondary button-compact'>
              {t('adminPayments.openCustomerTracking')}
            </LocalizedLink>
          </div>
        </div>

        <div className='grid-2'>
          <div className='page-stack'>
            <AdminPaymentSummaryCard quoteId={quoteId} paymentData={paymentData} />

            <div className='policy-card'>
              <div className='kicker'>{t('adminPayments.finalBalanceKicker')}</div>
              <h3>{t('adminPayments.finalBalanceTitle')}</h3>
              <p>{t('adminPayments.finalBalanceIntro')}</p>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'>
                  <span>{t('adminPayments.finalBalanceDueLabel')}</span>
                  <span>${Number(summary.finalBalanceDue || 0).toFixed(2)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span>{t('adminPayments.shippingBlockedLabel')}</span>
                  <span>{summary.paymentBlockedShipping ? t('adminPayments.yes') : t('adminPayments.no')}</span>
                </div>
              </div>
              {error ? <div className='notice' style={{ marginTop: 16 }}>{error}</div> : null}
              {success ? <div className='notice' style={{ marginTop: 16 }}>{success}</div> : null}
              <div className='inline-actions' style={{ marginTop: 16 }}>
                <button
                  type='button'
                  className='button button-primary'
                  disabled={requesting || Number(summary.finalBalanceDue || 0) <= 0}
                  onClick={handleRequestFinalBalance}
                >
                  {requesting ? t('adminPayments.requestingEllipsis') : t('adminPayments.requestFinalBalance')}
                </button>
                <LocalizedLink href={`/pay/${quoteId}/balance`} className='button button-secondary'>
                  {t('adminPayments.openCustomerBalance')}
                </LocalizedLink>
              </div>
            </div>
          </div>

          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>{t('adminPayments.policyKicker')}</div>
              <h3>{t('adminPayments.policyTitle')}</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>{t('adminPayments.policyDepositLabel')}</span><span>{t('adminPayments.policyDepositValue')}</span></div>
                <div className='preview-meta-row'><span>{t('adminPayments.policyBalanceLabel')}</span><span>{t('adminPayments.policyBalanceValue')}</span></div>
                <div className='preview-meta-row'><span>{t('adminPayments.policyTrackingLabel')}</span><span>{t('adminPayments.policyTrackingValue')}</span></div>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminPayments.quickLinksKicker')}</div>
              <h3>{t('adminPayments.quickLinksTitle')}</h3>
              <div className='inline-actions'>
                <LocalizedLink href={`/estimate-review/${quoteId}`} className='button button-secondary'>
                  {t('adminPayments.reviewPage')}
                </LocalizedLink>
                <LocalizedLink href={`/mail-in/${quoteId}`} className='button button-secondary'>
                  {t('adminPayments.mailInPage')}
                </LocalizedLink>
                <LocalizedLink href={`/track/${quoteId}`} className='button button-secondary'>
                  {t('adminPayments.trackingPage')}
                </LocalizedLink>
                <LocalizedLink href={`/pay/${quoteId}/balance`} className='button button-secondary'>
                  {t('adminPayments.balancePage')}
                </LocalizedLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
