'use client'

import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../lib/i18n/TranslationProvider'

export default function CustomerEstimateReviewPage({ quoteId, orgSlug, tok }) {
  const t = useT()
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

  function formatEstimateDecisionLabel(status) {
    if (status === 'approved') return t('estimateReview.decisionLabelApproved')
    if (status === 'declined') return t('estimateReview.decisionLabelDeclined')
    return t('estimateReview.decisionLabelDefault')
  }

  const totalDisplay = useMemo(() => {
    if (!record?.estimate?.total_amount && record?.estimate?.total_amount !== 0) return '—'
    return `$${Number(record.estimate.total_amount).toFixed(2)}`
  }, [record])

  const handleVerify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResultMessage('')
    setManualPaymentInfo(null)

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
          ...(tok ? { tok } : {}),
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t('estimateReview.unableToVerify'))

      setRecord(result)
      setMailInPath(result.mailInPath || '')
      setTrackingPath(result.trackingPath || '')
    } catch (verifyError) {
      setRecord(null)
      setMailInPath('')
      setTrackingPath('')
      setError(verifyError.message || t('estimateReview.unableToVerify'))
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
          ...(tok ? { tok } : {}),
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t('estimateReview.unableToUpdate'))

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
          setResultMessage(t('estimateReview.estimateApprovedTrackingMsg'))
        } else {
          setResultMessage(
            result.orderNumber
              ? t('estimateReview.estimateApprovedWithOrderMsg', { orderNumber: result.orderNumber })
              : t('estimateReview.estimateApprovedMsg')
          )
        }
      } else {
        setResultMessage(t('estimateReview.estimateDeclinedMsg'))
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
      setError(decisionError.message || t('estimateReview.unableToUpdate'))
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
          <div className='kicker'>{t('estimateReview.reviewKicker')}</div>
          <h1>{t('estimateReview.reviewTitleAlt')}</h1>
          <p>{t('estimateReview.reviewIntro')}</p>
        </div>

        <div className='grid-2'>
          <form className='policy-card' onSubmit={handleVerify}>
            <div className='kicker'>{t('estimateReview.verifyKicker')}</div>
            <h3>{t('estimateReview.verifyTitle')}</h3>
            <div className='field' style={{ marginTop: 18 }}>
              <label htmlFor='estimate-review-email'>{t('tracking.emailLabel')}</label>
              <input
                id='estimate-review-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('estimateReview.emailPlaceholder')}
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
                  {t('estimateReview.depositInstructionsTitle')}
                </strong>
                {manualPaymentInfo.depositAmount > 0 ? (
                  <span style={{ display: 'block', marginBottom: 8 }}>
                    {t('estimateReview.inspectionDepositDue', { amount: Number(manualPaymentInfo.depositAmount).toFixed(2) })}
                  </span>
                ) : null}
                {manualPaymentInfo.instructions ? (
                  <span style={{ display: 'block', whiteSpace: 'pre-line' }}>
                    {manualPaymentInfo.instructions}
                  </span>
                ) : (
                  <span>{t('estimateReview.contactShopForPayment')}</span>
                )}
              </div>
            ) : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? t('estimateReview.verifying') : t('estimateReview.viewEstimateBtn')}
              </button>
            </div>
          </form>

          <div className='policy-card'>
            <div className='kicker'>{t('estimateReview.whatHappensNextKicker')}</div>
            <h3>{t('estimateReview.whatHappensNextTitle')}</h3>
            <div className='preview-meta' style={{ marginTop: 18 }}>
              <div className='preview-meta-row'>
                <span>1</span>
                <span>{t('estimateReview.step1Text')}</span>
              </div>
              <div className='preview-meta-row'>
                <span>2</span>
                <span>{t('estimateReview.step2Text')}</span>
              </div>
              <div className='preview-meta-row'>
                <span>3</span>
                <span>
                  {record?.estimate?.estimate_kind != null && record.estimate.estimate_kind !== 'preliminary'
                    ? t('estimateReview.step3TextRevised')
                    : t('estimateReview.step3TextPreliminary')}
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
                  {record.estimate.estimate_kind === 'final'
                    ? t('estimateReview.finalEstimateTitle')
                    : t('estimateReview.revisedEstimateTitle')}
                </strong>
                {record.estimate.estimate_kind === 'final'
                  ? t('estimateReview.finalEstimateText')
                  : t('estimateReview.revisedEstimateText')}
              </div>
            ) : null}

            <div className='quote-card'>
              <div className='quote-top'>
                <div>
                  <div className='quote-id'>{record.quote.quote_id}</div>
                  <h2 className='quote-title'>
                    {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')}
                  </h2>
                  <p className='muted'>{record.quote.repair_type_key || t('estimateReview.noRepairType')}</p>
                </div>
                <span className='price-chip'>{record.estimate.status}</span>
              </div>

              <div className='quote-summary'>
                <div className='quote-summary-card'>
                  <strong>{t('estimateReview.totalEstimateLabel')}</strong>
                  <span>{totalDisplay}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>{t('estimateReview.warrantyLabel')}</strong>
                  <span>{record.estimate.warranty_days ? t('estimateReview.warrantyDays', { count: record.estimate.warranty_days }) : '—'}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>{t('estimateReview.turnaroundLabel')}</strong>
                  <span>{record.estimate.turnaround_note || t('estimateReview.turnaroundAfterApproval')}</span>
                </div>
              </div>
            </div>

            <div className='grid-2'>
              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>{t('estimateReview.itemsKicker')}</div>
                  <h3>{t('estimateReview.itemsTitle')}</h3>
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
                  <div className='kicker'>{t('estimateReview.summaryKicker')}</div>
                  <h3>{t('estimateReview.summaryTitle')}</h3>
                  <p>
                    {record.estimate.customer_visible_notes ||
                      record.quote.quote_summary ||
                      t('estimateReview.noNotes')}
                  </p>
                </div>
              </div>

              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>{t('estimateReview.totalsKicker')}</div>
                  <h3>{t('estimateReview.totalsTitle')}</h3>
                  <div className='preview-meta' style={{ marginTop: 18 }}>
                    <div className='preview-meta-row'>
                      <span>{t('estimateReview.subtotal')}</span>
                      <span>${Number(record.estimate.subtotal_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>{t('estimateReview.shipping')}</span>
                      <span>${Number(record.estimate.shipping_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>{t('estimateReview.tax')}</span>
                      <span>${Number(record.estimate.tax_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>{t('estimateReview.discount')}</span>
                      <span>-${Number(record.estimate.discount_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>{t('estimateReview.depositCredit')}</span>
                      <span>-${Number(record.estimate.deposit_credit_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>{t('estimateReview.total')}</span>
                      <span>{totalDisplay}</span>
                    </div>
                  </div>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>{t('estimateReview.decisionKicker')}</div>
                  <h3>{t('estimateReview.decisionTitle')}</h3>

                  {decisionLocked ? (
                    <div className='decision-card-locked'>
                      <div className='decision-state-pill'>
                        {formatEstimateDecisionLabel(record.estimate.status)}
                      </div>

                      <div className='notice notice-success'>
                        {decisionTimestamp
                          ? t('estimateReview.recordedOn', { date: new Date(decisionTimestamp).toLocaleString() })
                          : t('estimateReview.alreadyDecided', { status: record.estimate.status })}
                      </div>

                      <div className='inline-actions' style={{ marginTop: 0 }}>
                        {mailInPath ? (
                          <LocalizedLink href={mailInPath} className='button button-secondary'>
                            {t('estimateReview.mailInBtn')}
                          </LocalizedLink>
                        ) : null}

                        {trackingPath ? (
                          <LocalizedLink href={trackingPath} className='button button-secondary'>
                            {t('estimateReview.trackingBtn')}
                          </LocalizedLink>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>
                        {record.estimate.estimate_kind !== 'preliminary'
                          ? t('estimateReview.approveTextRevised')
                          : t('estimateReview.approveTextPreliminary')}
                      </p>

                      <div className='inline-actions'>
                        <button
                          type='button'
                          className='button button-primary'
                          onClick={() => handleDecision('approve')}
                          disabled={submittingAction !== ''}
                        >
                          {submittingAction === 'approve' ? t('estimateReview.approving') : t('estimateReview.approveBtn')}
                        </button>
                        <button
                          type='button'
                          className='button button-secondary'
                          onClick={() => handleDecision('decline')}
                          disabled={submittingAction !== ''}
                        >
                          {submittingAction === 'decline' ? t('estimateReview.declining') : t('estimateReview.declineBtn')}
                        </button>
                      </div>

                      {mailInPath ? (
                        <div className='inline-actions' style={{ marginTop: 14 }}>
                          <LocalizedLink href={mailInPath} className='button button-secondary'>
                            {t('estimateReview.mailInBtn')}
                          </LocalizedLink>
                        </div>
                      ) : null}

                      {trackingPath ? (
                        <div className='inline-actions' style={{ marginTop: 14 }}>
                          <LocalizedLink href={trackingPath} className='button button-secondary'>
                            {t('estimateReview.trackingBtn')}
                          </LocalizedLink>
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
