'use client'

import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

function fmt(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

export default function AdminPaymentSummaryCard({ quoteId, paymentData, compact = false }) {
  const t = useT()
  if (!paymentData) {
    return (
      <div className='policy-card'>
        <div className='kicker'>{t('adminPayments.summaryKicker')}</div>
        <h3>{t('adminPayments.summaryTitle')}</h3>
        <p>{t('adminPayments.summaryUnavailable')}</p>
      </div>
    )
  }

  const summary = paymentData.summary || {}
  const payments = paymentData.payments || []

  return (
    <div className='policy-card'>
      <div className='kicker'>{t('adminPayments.summaryKicker')}</div>
      <h3>{t('adminPayments.summaryTitle')}</h3>

      <div className='preview-meta' style={{ marginTop: 18 }}>
        <div className='preview-meta-row'>
          <span>{t('adminPayments.estimateTotalLabel')}</span>
          <span>{fmt(summary.estimateTotal)}</span>
        </div>
        <div className='preview-meta-row'>
          <span>{t('adminPayments.depositRequiredLabel')}</span>
          <span>{fmt(summary.depositRequired)}</span>
        </div>
        <div className='preview-meta-row'>
          <span>{t('adminPayments.depositPaidLabel')}</span>
          <span>{fmt(summary.depositPaidAmount)}</span>
        </div>
        <div className='preview-meta-row'>
          <span>{t('adminPayments.finalBalancePaidLabel')}</span>
          <span>{fmt(summary.finalBalancePaidAmount)}</span>
        </div>
        <div className='preview-meta-row'>
          <span><strong>{t('adminPayments.totalCollectedLabel')}</strong></span>
          <span><strong>{fmt(summary.totalCollected)}</strong></span>
        </div>
        <div className='preview-meta-row'>
          <span><strong>{t('adminPayments.finalBalanceDueLabelShort')}</strong></span>
          <span><strong>{fmt(summary.finalBalanceDue)}</strong></span>
        </div>
      </div>

      <div className='preview-meta' style={{ marginTop: 18 }}>
        <div className='preview-meta-row'>
          <span>{t('adminPayments.depositStatusLabel')}</span>
          <span>{summary.depositPaid ? t('adminPayments.depositPaidValue') : t('adminPayments.depositUnpaidValue')}</span>
        </div>
        <div className='preview-meta-row'>
          <span>{t('adminPayments.finalBalanceStatusLabel')}</span>
          <span>{summary.finalBalancePaid ? t('adminPayments.finalBalancePaidValue') : t('adminPayments.finalBalanceOutstandingValue')}</span>
        </div>
        <div className='preview-meta-row'>
          <span>{t('adminPayments.shippingBlockLabel')}</span>
          <span>{summary.paymentBlockedShipping ? t('adminPayments.shippingBlocked') : t('adminPayments.shippingClear')}</span>
        </div>
      </div>

      {!compact ? (
        <>
          <div style={{ marginTop: 18 }}>
            <strong style={{ fontSize: 13 }}>{t('adminPayments.paymentRecords')}</strong>
          </div>
          <div className='preview-meta' style={{ marginTop: 8 }}>
            {payments.length ? (
              payments.map((payment) => (
                <div key={payment.id} className='preview-meta-row'>
                  <span>
                    {payment.payment_kind} · {payment.status}
                    {payment.paid_at ? ` · ${new Date(payment.paid_at).toLocaleString()}` : ''}
                  </span>
                  <span>{fmt(payment.amount)}</span>
                </div>
              ))
            ) : (
              <div className='preview-meta-row'>
                <span>{t('adminPayments.noPayments')}</span>
                <span>—</span>
              </div>
            )}
          </div>
        </>
      ) : null}

      <div className='inline-actions' style={{ marginTop: 16 }}>
        <LocalizedLink href={`/pay/${quoteId}/balance`} className='button button-secondary'>
          {t('adminPayments.openBalancePage')}
        </LocalizedLink>
      </div>
    </div>
  )
}
