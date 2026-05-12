'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

function formatEstimateDecisionLabel(status) {
  if (status === 'approved') return 'Estimate Accepted'
  if (status === 'declined') return 'Estimate Declined'
  return 'Decision'
}

export default function CustomerEstimateReviewPage({ quoteId, orgSlug }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittingAction, setSubmittingAction] = useState('')
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)
  const [resultMessage, setResultMessage] = useState('')
  const [mailInPath, setMailInPath] = useState('')
  const [trackingPath, setTrackingPath] = useState('')
  const [manualPaymentInfo, setManualPaymentInfo] = useState(null)

  const totalDisplay = useMemo(() => {
    if (!record?.estimate?.total_amount && record?.estimate?.total_amount !== 0) return '—'
    return `$${Number(record.estimate.total_amount).toFixed(2)}`
  }, [record])

  const handleVerify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResultMessage('')

    try {
      const response = await fetch(`/api/estimate-review/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'view',
          ...(orgSlug ? { orgSlug } : {}),
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to verify this estimate.')

      setRecord(result)
      setMailInPath(result.mailInPath || '')
      setTrackingPath(result.trackingPath || '')
    } catch (verifyError) {
      setRecord(null)
      setMailInPath('')
      setTrackingPath('')
      setError(verifyError.message || 'Unable to verify this estimate.')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (action) => {
    setSubmittingAction(action)
    setError('')
    setResultMessage('')

    try {
      const response = await fetch(`/api/estimate-review/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action,
          ...(orgSlug ? { orgSlug } : {}),
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to update estimate decision.')

      if (action === 'approve' && result.requiresPayment) {
        router.push(result.checkoutPath)
        return
      }

      if (action === 'approve' && result.manualPaymentMode) {
        setManualPaymentInfo({
          instructions: result.manualInstructions || '',
          depositAmount: result.depositAmount || 0,
        })
      }

      const actionTimestamp = new Date().toISOString()

      if (action === 'approve') {
        if (result.nextAction === 'tracking') {
          setResultMessage('Estimate approved. Repair can now continue and your tracking page has been updated.')
        } else {
          setResultMessage(
            result.orderNumber
              ? `Estimate approved. Repair order ${result.orderNumber} has been created and the request is now ready for mail-in instructions.`
              : 'Estimate approved. The request is now ready for mail-in instructions.'
          )
        }
      } else {
        setResultMessage('Estimate declined. The quote has been updated.')
      }

      setMailInPath(result.mailInPath || '')
      setTrackingPath(result.trackingPath || '')

      setRecord((current) =>
        current
          ? {
              ...current,
              quote: {
                ...current.quote,
                status: result.quoteStatus,
              },
              estimate: {
                ...current.estimate,
                status: result.estimateStatus,
                approved_at:
                  action === 'approve'
                    ? current.estimate.approved_at || actionTimestamp
                    : current.estimate.approved_at,
                declined_at:
                  action === 'decline'
                    ? current.estimate.declined_at || actionTimestamp
                    : current.estimate.declined_at,
              },
            }
          : current
      )
    } catch (decisionError) {
      setError(decisionError.message || 'Unable to update estimate decision.')
    } finally {
      setSubmittingAction('')
    }
  }

  const decisionLocked =
    record?.estimate?.status === 'approved' || record?.estimate?.status === 'declined'

  const decisionTimestamp =
    record?.estimate?.status === 'approved'
      ? record?.estimate?.approved_at
      : record?.estimate?.status === 'declined'
        ? record?.estimate?.declined_at
        : null

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Estimate review</div>
          <h1>Review the repair estimate before anything moves forward</h1>
          <p>
            Enter the same email used for the estimate request to securely view pricing, included
            line items, turnaround notes, and the current decision status.
          </p>
        </div>

        <div className='grid-2'>
          <form className='policy-card' onSubmit={handleVerify}>
            <div className='kicker'>Verify request</div>
            <h3>Enter your email</h3>
            <div className='field' style={{ marginTop: 18 }}>
              <label htmlFor='estimate-review-email'>Email address</label>
              <input
                id='estimate-review-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='name@example.com'
                required
              />
            </div>

            {error ? <div className='notice notice-warn' style={{ marginTop: 18 }}>{error}</div> : null}
            {resultMessage ? (
              <div className='notice notice-success' style={{ marginTop: 18 }}>
                {resultMessage}
              </div>
            ) : null}

            {manualPaymentInfo ? (
              <div className='notice notice-warn' style={{ marginTop: 18 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>
                  Deposit payment instructions
                </strong>
                {manualPaymentInfo.depositAmount > 0 ? (
                  <span style={{ display: 'block', marginBottom: 8 }}>
                    Inspection deposit due: <strong>${Number(manualPaymentInfo.depositAmount).toFixed(2)}</strong>
                  </span>
                ) : null}
                {manualPaymentInfo.instructions ? (
                  <span style={{ display: 'block', whiteSpace: 'pre-line' }}>
                    {manualPaymentInfo.instructions}
                  </span>
                ) : (
                  <span>Please contact the shop for payment details.</span>
                )}
              </div>
            ) : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? 'Verifying…' : 'View Estimate'}
              </button>
            </div>
          </form>

          <div className='policy-card'>
            <div className='kicker'>What happens next</div>
            <h3>Approval controls the next stage</h3>
            <div className='preview-meta' style={{ marginTop: 18 }}>
              <div className='preview-meta-row'>
                <span>1</span>
                <span>Review the estimate and included line items.</span>
              </div>
              <div className='preview-meta-row'>
                <span>2</span>
                <span>Approve only if you want the repair flow to continue.</span>
              </div>
              <div className='preview-meta-row'>
                <span>3</span>
                <span>
                  {record?.estimate?.estimate_kind != null && record.estimate.estimate_kind !== 'preliminary'
                    ? 'If this is revised or final, the repair continues only after your approval.'
                    : 'After approval, follow the next-step page shown by the system.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {record ? (
          <div className='page-stack'>
            {record.estimate.estimate_kind !== 'preliminary' ? (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>
                  {record.estimate.estimate_kind === 'final' ? 'Final estimate' : 'Revised estimate'}
                </strong>
                {record.estimate.estimate_kind === 'final'
                  ? 'Inspection and diagnosis are complete. This final estimate reflects the full cost of the repair. Approving it authorizes the shop to proceed.'
                  : 'New findings during inspection changed the repair scope. Please review the updated line items and cost before deciding whether to continue.'}
              </div>
            ) : null}

            <div className='quote-card'>
              <div className='quote-top'>
                <div>
                  <div className='quote-id'>{record.quote.quote_id}</div>
                  <h2 className='quote-title'>
                    {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')}
                  </h2>
                  <p className='muted'>{record.quote.repair_type_key || 'Repair type not set'}</p>
                </div>
                <span className='price-chip'>{record.estimate.status}</span>
              </div>

              <div className='quote-summary'>
                <div className='quote-summary-card'>
                  <strong>Total estimate</strong>
                  <span>{totalDisplay}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>Warranty</strong>
                  <span>{record.estimate.warranty_days ? `${record.estimate.warranty_days} days` : '—'}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>Turnaround</strong>
                  <span>{record.estimate.turnaround_note || 'After approval'}</span>
                </div>
              </div>
            </div>

            <div className='grid-2'>
              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>Estimate items</div>
                  <h3>Included services and charges</h3>
                  <div className='preview-meta' style={{ marginTop: 18 }}>
                    {record.items.map((item) => (
                      <div key={item.id} className='preview-meta-row'>
                        <span>
                          {item.description} · {item.quantity} × ${Number(item.unit_amount).toFixed(2)}
                        </span>
                        <span>${Number(item.line_total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>Summary</div>
                  <h3>Repair notes</h3>
                  <p>
                    {record.estimate.customer_visible_notes ||
                      record.quote.quote_summary ||
                      'No additional customer note provided.'}
                  </p>
                </div>
              </div>

              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>Estimate totals</div>
                  <h3>Breakdown</h3>
                  <div className='preview-meta' style={{ marginTop: 18 }}>
                    <div className='preview-meta-row'>
                      <span>Subtotal</span>
                      <span>${Number(record.estimate.subtotal_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Shipping</span>
                      <span>${Number(record.estimate.shipping_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Tax</span>
                      <span>${Number(record.estimate.tax_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Discount</span>
                      <span>-${Number(record.estimate.discount_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Deposit credit</span>
                      <span>-${Number(record.estimate.deposit_credit_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Total</span>
                      <span>{totalDisplay}</span>
                    </div>
                  </div>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>Decision</div>
                  <h3>Approve or decline</h3>

                  {decisionLocked ? (
                    <div className='decision-card-locked'>
                      <div className='decision-state-pill'>
                        {formatEstimateDecisionLabel(record.estimate.status)}
                      </div>

                      <div className='notice notice-success'>
                        {decisionTimestamp
                          ? `Recorded on ${new Date(decisionTimestamp).toLocaleString()}`
                          : `This estimate has already been ${record.estimate.status}.`}
                      </div>

                      <div className='inline-actions' style={{ marginTop: 0 }}>
                        {mailInPath ? (
                          <Link href={mailInPath} className='button button-secondary'>
                            View Mail-In Instructions
                          </Link>
                        ) : null}

                        {trackingPath ? (
                          <Link href={trackingPath} className='button button-secondary'>
                            Open Tracking Page
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>
                        {record.estimate.estimate_kind !== 'preliminary'
                          ? 'Approving this revised estimate authorizes the repair to continue. Declining will close this estimate path.'
                          : 'Approving this estimate moves the repair to the next stage. Declining will close this estimate path.'}
                      </p>

                      <div className='inline-actions'>
                        <button
                          type='button'
                          className='button button-primary'
                          onClick={() => handleDecision('approve')}
                          disabled={submittingAction !== ''}
                        >
                          {submittingAction === 'approve' ? 'Approving…' : 'Approve Estimate'}
                        </button>
                        <button
                          type='button'
                          className='button button-secondary'
                          onClick={() => handleDecision('decline')}
                          disabled={submittingAction !== ''}
                        >
                          {submittingAction === 'decline' ? 'Declining…' : 'Decline Estimate'}
                        </button>
                      </div>

                      {mailInPath ? (
                        <div className='inline-actions' style={{ marginTop: 14 }}>
                          <Link href={mailInPath} className='button button-secondary'>
                            View Mail-In Instructions
                          </Link>
                        </div>
                      ) : null}

                      {trackingPath ? (
                        <div className='inline-actions' style={{ marginTop: 14 }}>
                          <Link href={trackingPath} className='button button-secondary'>
                            Open Tracking Page
                          </Link>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}