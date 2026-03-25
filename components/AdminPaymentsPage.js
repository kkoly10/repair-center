'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import AdminPaymentSummaryCard from './AdminPaymentSummaryCard'

export default function AdminPaymentsPage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminPaymentsInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function AdminPaymentsInner({ quoteId }) {
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
        if (!response.ok) throw new Error(result.error || 'Unable to load payment summary.')
        if (!ignore) setPaymentData(result)
      } catch (err) {
        if (!ignore) setError(err.message || 'Unable to load payment summary.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [quoteId])

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
      if (!response.ok) throw new Error(result.error || 'Unable to request final balance.')

      setSuccess(
        result.amountDue > 0
          ? `Final balance request sent for $${Number(result.amountDue).toFixed(2)}.`
          : 'Final balance request sent.'
      )

      const refreshResponse = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, {
        cache: 'no-store',
      })
      const refreshResult = await refreshResponse.json()
      if (refreshResponse.ok) setPaymentData(refreshResult)
    } catch (err) {
      setError(err.message || 'Unable to request final balance.')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>Loading payment operations…</div>
        </div>
      </main>
    )
  }

  if (error && !paymentData) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>Unable to open payments</h1>
            <p>{error}</p>
            <div className='inline-actions'>
              <Link href={`/admin/quotes/${quoteId}`} className='button button-secondary'>
                Back to quote
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const summary = paymentData?.summary || {}
  const orderNumber = paymentData?.repairOrder?.order_number || 'Pending'

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='quote-card'>
          <div className='quote-top'>
            <div>
              <div className='quote-id'>{paymentData?.quote?.quote_id}</div>
              <h1 className='quote-title'>Payments · Order #{orderNumber}</h1>
              <p className='muted'>
                {[paymentData?.quote?.brand_name, paymentData?.quote?.model_name].filter(Boolean).join(' ')} ·{' '}
                {paymentData?.quote?.repair_type_key || 'Repair type not set'}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <Link href={`/admin/quotes/${quoteId}`} className='button button-secondary button-compact'>
              Back to Quote
            </Link>
            <Link href={`/admin/quotes/${quoteId}/order`} className='button button-secondary button-compact'>
              Back to Repair Order
            </Link>
            <Link href={`/track/${quoteId}`} className='button button-secondary button-compact'>
              Open Customer Tracking
            </Link>
          </div>
        </div>

        <div className='grid-2'>
          <div className='page-stack'>
            <AdminPaymentSummaryCard quoteId={quoteId} paymentData={paymentData} />

            <div className='policy-card'>
              <div className='kicker'>Final balance operations</div>
              <h3>Request customer payment</h3>
              <p>
                Use this action when the repair is complete and the customer needs to pay the remaining balance before return shipping.
              </p>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'>
                  <span>Current final balance due</span>
                  <span>${Number(summary.finalBalanceDue || 0).toFixed(2)}</span>
                </div>
                <div className='preview-meta-row'>
                  <span>Shipping blocked</span>
                  <span>{summary.paymentBlockedShipping ? 'Yes' : 'No'}</span>
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
                  {requesting ? 'Requesting…' : 'Request Final Balance'}
                </button>
                <Link href={`/pay/${quoteId}/balance`} className='button button-secondary'>
                  Open Customer Balance Page
                </Link>
              </div>
            </div>
          </div>

          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>Payment policy</div>
              <h3>Operational guidance</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>Deposit</span><span>Collected before mail-in when required</span></div>
                <div className='preview-meta-row'><span>Balance</span><span>Collected before outbound shipping</span></div>
                <div className='preview-meta-row'><span>Tracking</span><span>Customer can follow status from the tracking page</span></div>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Next pages</div>
              <h3>Customer-facing links</h3>
              <div className='inline-actions'>
                <Link href={`/estimate-review/${quoteId}`} className='button button-secondary'>
                  Review Page
                </Link>
                <Link href={`/mail-in/${quoteId}`} className='button button-secondary'>
                  Mail-In Page
                </Link>
                <Link href={`/track/${quoteId}`} className='button button-secondary'>
                  Tracking Page
                </Link>
                <Link href={`/pay/${quoteId}/balance`} className='button button-secondary'>
                  Balance Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
