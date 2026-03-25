'use client'

import Link from 'next/link'

function fmt(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

export default function AdminPaymentSummaryCard({ quoteId, paymentData, compact = false }) {
  if (!paymentData) {
    return (
      <div className='policy-card'>
        <div className='kicker'>Payments</div>
        <h3>Payment summary</h3>
        <p>Payment data is not available yet.</p>
      </div>
    )
  }

  const summary = paymentData.summary || {}
  const payments = paymentData.payments || []

  return (
    <div className='policy-card'>
      <div className='kicker'>Payments</div>
      <h3>Payment summary</h3>

      <div className='preview-meta' style={{ marginTop: 18 }}>
        <div className='preview-meta-row'>
          <span>Estimate total</span>
          <span>{fmt(summary.estimateTotal)}</span>
        </div>
        <div className='preview-meta-row'>
          <span>Deposit required</span>
          <span>{fmt(summary.depositRequired)}</span>
        </div>
        <div className='preview-meta-row'>
          <span>Deposit paid</span>
          <span>{fmt(summary.depositPaidAmount)}</span>
        </div>
        <div className='preview-meta-row'>
          <span>Final balance paid</span>
          <span>{fmt(summary.finalBalancePaidAmount)}</span>
        </div>
        <div className='preview-meta-row'>
          <span><strong>Total collected</strong></span>
          <span><strong>{fmt(summary.totalCollected)}</strong></span>
        </div>
        <div className='preview-meta-row'>
          <span><strong>Final balance due</strong></span>
          <span><strong>{fmt(summary.finalBalanceDue)}</strong></span>
        </div>
      </div>

      <div className='preview-meta' style={{ marginTop: 18 }}>
        <div className='preview-meta-row'>
          <span>Deposit status</span>
          <span>{summary.depositPaid ? 'Paid' : 'Unpaid'}</span>
        </div>
        <div className='preview-meta-row'>
          <span>Final balance status</span>
          <span>{summary.finalBalancePaid ? 'Paid' : 'Outstanding'}</span>
        </div>
        <div className='preview-meta-row'>
          <span>Shipping block</span>
          <span>{summary.paymentBlockedShipping ? 'Blocked by unpaid balance' : 'Clear'}</span>
        </div>
      </div>

      {!compact ? (
        <>
          <div style={{ marginTop: 18 }}>
            <strong style={{ fontSize: 13 }}>Payment records</strong>
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
                <span>No payments recorded yet.</span>
                <span>—</span>
              </div>
            )}
          </div>
        </>
      ) : null}

      <div className='inline-actions' style={{ marginTop: 16 }}>
        <Link href={`/pay/${quoteId}/balance`} className='button button-secondary'>
          Open Balance Page
        </Link>
      </div>
    </div>
  )
}
