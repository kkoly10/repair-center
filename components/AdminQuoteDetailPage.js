'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import QuoteStatusBadge from './QuoteStatusBadge'
import AdminPaymentSummaryCard from './AdminPaymentSummaryCard'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { getSupabaseBrowser } from '../lib/supabase/browser'

const STATUS_KEYS = [
  { value: 'submitted', tKey: 'adminQuotes.statusOptionSubmitted' },
  { value: 'under_review', tKey: 'adminQuotes.statusOptionUnderReview' },
  { value: 'estimate_sent', tKey: 'adminQuotes.statusOptionEstimateSent' },
  { value: 'awaiting_customer', tKey: 'adminQuotes.statusOptionAwaitingCustomer' },
  { value: 'approved_for_mail_in', tKey: 'adminQuotes.statusOptionApprovedForMailIn' },
  { value: 'declined', tKey: 'adminQuotes.statusOptionDeclined' },
  { value: 'archived', tKey: 'adminQuotes.statusOptionArchived' },
]

export default function AdminQuoteDetailPage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminQuoteDetailInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function AdminQuoteDetailInner({ quoteId }) {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [record, setRecord] = useState(null)
  const [expandedEstimateId, setExpandedEstimateId] = useState(null)
  const [estimateDetails, setEstimateDetails] = useState({})
  const [paymentData, setPaymentData] = useState(null)
  const [markingDepositPaid, setMarkingDepositPaid] = useState(false)
  const [depositPaidSuccess, setDepositPaidSuccess] = useState(false)
  const [depositPaidError, setDepositPaidError] = useState('')

  const [status, setStatus] = useState('submitted')
  const [quoteSummary, setQuoteSummary] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [priceFixed, setPriceFixed] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadRecord() {
      setLoading(true)
      setError('')

      try {
        const supabase = getSupabaseBrowser()

        const { data: quote, error: quoteError } = await supabase
          .from('quote_requests')
          .select('*')
          .eq('quote_id', quoteId)
          .maybeSingle()

        if (quoteError) throw quoteError
        if (!quote) throw new Error(t('adminQuoteDetail.quoteNotFound'))

        const [
          photosResult,
          pricingRuleResult,
          customerResult,
          estimatesResult,
          paymentResponse,
        ] = await Promise.all([
          supabase
            .from('quote_request_photos')
            .select('id, storage_path, photo_type, sort_order, created_at')
            .eq('quote_request_id', quote.id)
            .order('sort_order', { ascending: true }),
          quote.selected_pricing_rule_id
            ? supabase
                .from('pricing_rules')
                .select('*')
                .eq('id', quote.selected_pricing_rule_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          quote.customer_id
            ? supabase
                .from('customers')
                .select(
                  'id, first_name, last_name, email, phone, preferred_contact_method'
                )
                .eq('id', quote.customer_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from('quote_estimates')
            .select(
              'id, estimate_kind, status, total_amount, created_at, sent_at, expires_at'
            )
            .eq('quote_request_id', quote.id)
            .order('created_at', { ascending: false }),
          fetch(`/admin/api/quotes/${quoteId}/payment-summary`, { cache: 'no-store' }),
        ])

        if (photosResult.error) throw photosResult.error
        if (pricingRuleResult.error) throw pricingRuleResult.error
        if (customerResult.error) throw customerResult.error
        if (estimatesResult.error) throw estimatesResult.error

        const paymentResult = await paymentResponse.json().catch(() => null)

        const photos = await Promise.all(
          (photosResult.data || []).map(async (photo) => {
            const { data, error: signedUrlError } = await supabase.storage
              .from('repair-uploads')
              .createSignedUrl(photo.storage_path, 3600)

            return {
              ...photo,
              signed_url: signedUrlError ? null : data?.signedUrl || null,
              signed_url_error: signedUrlError ? signedUrlError.message : null,
            }
          })
        )

        const normalized = {
          quote,
          pricingRule: pricingRuleResult.data,
          customer: customerResult.data,
          photos,
          estimates: estimatesResult.data || [],
          customerName:
            (
              customerResult.data
                ? [customerResult.data.first_name, customerResult.data.last_name]
                : [quote.first_name, quote.last_name]
            )
              .filter(Boolean)
              .join(' ') || t('adminQuoteDetail.guestCustomer'),
        }

        if (!ignore) {
          setRecord(normalized)
          setStatus(quote.status || 'submitted')
          setQuoteSummary(quote.quote_summary || '')
          setInternalNotes(quote.internal_notes || '')
          setPriceFixed(toInputValue(quote.preliminary_price_fixed))
          setPriceMin(toInputValue(quote.preliminary_price_min))
          setPriceMax(toInputValue(quote.preliminary_price_max))
          setPaymentData(paymentResponse.ok ? paymentResult : null)
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || t('adminQuoteDetail.loadFailed'))
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRecord()
    return () => {
      ignore = true
    }
  }, [quoteId, t])

  const priceDisplay = useMemo(() => {
    if (priceFixed !== '') return `$${Number(priceFixed || 0).toFixed(2)}`
    if (priceMin !== '' && priceMax !== '') {
      return `$${Number(priceMin || 0).toFixed(2)}–$${Number(priceMax || 0).toFixed(2)}`
    }
    return t('adminQuotes.manualReview')
  }, [priceFixed, priceMax, priceMin, t])

  const estimateActionLabel = useMemo(() => {
    if (!record?.estimates?.length) return t('adminQuoteDetail.createEstimate')
    return t('adminQuoteDetail.openEstimateBuilder')
  }, [record, t])

  const latestEstimate = useMemo(() => {
    return record?.estimates?.[0] || null
  }, [record])

  const reviewPath = `/estimate-review/${quoteId}`
  const mailInPath =
    status === 'approved_for_mail_in' ? `/mail-in/${quoteId}` : null
  const paymentsPath = `/admin/quotes/${quoteId}/payments`

  const handleMarkDepositPaid = async () => {
    setMarkingDepositPaid(true)
    setDepositPaidError('')
    setDepositPaidSuccess(false)
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/deposit`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || t('adminQuoteDetail.depositMarkFailed'))
      setDepositPaidSuccess(true)
      const refreshRes = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, { cache: 'no-store' })
      if (refreshRes.ok) setPaymentData(await refreshRes.json())
    } catch (err) {
      setDepositPaidError(err.message)
    } finally {
      setMarkingDepositPaid(false)
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!record) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const supabase = getSupabaseBrowser()
      const { data: userResult, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const payload = {
        status,
        quote_summary: quoteSummary || null,
        internal_notes: internalNotes || null,
        preliminary_price_fixed: priceFixed === '' ? null : Number(priceFixed),
        preliminary_price_min: priceMin === '' ? null : Number(priceMin),
        preliminary_price_max: priceMax === '' ? null : Number(priceMax),
        reviewed_at: new Date().toISOString(),
        reviewed_by_user_id: userResult.user?.id || null,
      }

      const { data: updated, error: updateError } = await supabase
        .from('quote_requests')
        .update(payload)
        .eq('id', record.quote.id)
        .select('*')
        .single()

      if (updateError) throw updateError

      setRecord((current) =>
        current
          ? {
              ...current,
              quote: {
                ...current.quote,
                ...updated,
              },
            }
          : current
      )

      setSuccess(t('adminQuoteDetail.quoteSaved'))
    } catch (saveError) {
      setError(saveError.message || t('adminQuoteDetail.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEstimate = async (estimateId) => {
    if (expandedEstimateId === estimateId) {
      setExpandedEstimateId(null)
      return
    }
    setExpandedEstimateId(estimateId)
    if (estimateDetails[estimateId]) return

    try {
      const response = await fetch(
        `/admin/api/quotes/${quoteId}/estimates/${estimateId}`,
        { cache: 'no-store' }
      )
      const result = await response.json()
      if (result.ok) {
        setEstimateDetails((current) => ({
          ...current,
          [estimateId]: { estimate: result.estimate, items: result.items },
        }))
      }
    } catch {
      // non-blocking
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>{t('adminQuoteDetail.loading')}</div>
        </div>
      </main>
    )
  }

  if (error && !record) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card center-card'>
            <div className='kicker'>{t('adminQuoteDetail.kicker')}</div>
            <h1>{t('adminQuoteDetail.headingUnableToOpen')}</h1>
            <p>{error}</p>
            <div className='inline-actions'>
              <LocalizedLink href='/admin/quotes' className='button button-secondary'>
                {t('adminQuoteDetail.backToQuotes')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='quote-card'>
          <div className='quote-top'>
            <div>
              <div className='quote-id'>{record.quote.quote_id}</div>
              <h1 className='quote-title'>{record.customerName}</h1>
              <p className='muted'>
                {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')} ·{' '}
                {record.quote.repair_type_key || t('adminQuoteDetail.repairTypeNotSet')}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <QuoteStatusBadge status={status} />
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <LocalizedLink href='/admin/quotes' className='button button-secondary button-compact'>
              {t('adminQuoteDetail.backToQueue')}
            </LocalizedLink>
            <LocalizedLink
              href={`/admin/quotes/${quoteId}/estimate`}
              className='button button-primary button-compact'
            >
              {estimateActionLabel}
            </LocalizedLink>
            <LocalizedLink
              href={`/admin/quotes/${quoteId}/order`}
              className='button button-secondary button-compact'
            >
              {t('adminQuoteDetail.manageRepairOrder')}
            </LocalizedLink>
            <LocalizedLink
              href={paymentsPath}
              className='button button-secondary button-compact'
            >
              {t('adminQuoteDetail.managePayments')}
            </LocalizedLink>
          </div>

          <div className='quote-summary'>
            <div className='quote-summary-card'>
              <strong>{t('adminQuoteDetail.estimatePreviewLabel')}</strong>
              <span>{priceDisplay}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>{t('adminQuoteDetail.submittedLabel')}</strong>
              <span>{new Date(record.quote.created_at).toLocaleString()}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>{t('adminQuoteDetail.preferredContactLabel')}</strong>
              <span>
                {record.customer?.preferred_contact_method ||
                  record.quote.preferred_contact_method ||
                  t('adminQuoteDetail.preferredContactDefault')}
              </span>
            </div>
          </div>
        </div>

        <div className='grid-2'>
          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.customerKicker')}</div>
              <h3>{t('adminQuoteDetail.contactDetailsTitle')}</h3>
              <div className='preview-meta'>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.nameLabel')}</span><span>{record.customerName}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.emailLabel')}</span><span>{record.customer?.email || record.quote.guest_email || '—'}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.phoneLabel')}</span><span>{record.customer?.phone || record.quote.guest_phone || '—'}</span></div>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.issueKicker')}</div>
              <h3>{t('adminQuoteDetail.customerNotesTitle')}</h3>
              <p>{record.quote.issue_description || t('adminQuoteDetail.noIssueDescription')}</p>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.powersOnLabel')}</span><span>{record.quote.powers_on || '—'}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.chargesLabel')}</span><span>{record.quote.charges || '—'}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.liquidDamageLabel')}</span><span>{record.quote.liquid_damage || '—'}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.priorRepairsLabel')}</span><span>{record.quote.prior_repairs || '—'}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.preserveDataLabel')}</span><span>{record.quote.preserve_data || '—'}</span></div>
              </div>
            </div>

            <form className='policy-card' onSubmit={handleSave}>
              <div className='kicker'>{t('adminQuoteDetail.reviewActionsKicker')}</div>
              <h3>{t('adminQuoteDetail.updateQuoteTitle')}</h3>
              <div className='page-stack' style={{ marginTop: 18 }}>
                <div className='field'>
                  <label htmlFor='admin-status'>{t('adminQuoteDetail.statusFieldLabel')}</label>
                  <select
                    id='admin-status'
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    {STATUS_KEYS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.tKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='field'>
                  <label htmlFor='admin-summary'>{t('adminQuoteDetail.customerSummaryLabel')}</label>
                  <textarea
                    id='admin-summary'
                    value={quoteSummary}
                    onChange={(event) => setQuoteSummary(event.target.value)}
                  />
                </div>

                <div className='form-grid'>
                  <div className='field'>
                    <label htmlFor='admin-price-fixed'>{t('adminQuoteDetail.priceFixedLabel')}</label>
                    <input
                      id='admin-price-fixed'
                      value={priceFixed}
                      onChange={(event) => setPriceFixed(event.target.value)}
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='admin-price-min'>{t('adminQuoteDetail.priceMinLabel')}</label>
                    <input
                      id='admin-price-min'
                      value={priceMin}
                      onChange={(event) => setPriceMin(event.target.value)}
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='admin-price-max'>{t('adminQuoteDetail.priceMaxLabel')}</label>
                    <input
                      id='admin-price-max'
                      value={priceMax}
                      onChange={(event) => setPriceMax(event.target.value)}
                    />
                  </div>
                </div>

                <div className='field'>
                  <label htmlFor='admin-internal-notes'>{t('adminQuoteDetail.internalNotesLabel')}</label>
                  <textarea
                    id='admin-internal-notes'
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                  />
                </div>

                {error ? <div className='notice'>{error}</div> : null}
                {success ? <div className='notice'>{success}</div> : null}

                <div className='inline-actions'>
                  <button type='submit' className='button button-primary' disabled={saving}>
                    {saving ? t('adminQuoteDetail.savingEllipsis') : t('adminQuoteDetail.saveReview')}
                  </button>
                  <LocalizedLink
                    href={`/admin/quotes/${quoteId}/estimate`}
                    className='button button-secondary'
                  >
                    {estimateActionLabel}
                  </LocalizedLink>
                  <LocalizedLink
                    href={`/admin/quotes/${quoteId}/order`}
                    className='button button-secondary'
                  >
                    {t('adminQuoteDetail.manageRepairOrder')}
                  </LocalizedLink>
                  <LocalizedLink
                    href={paymentsPath}
                    className='button button-secondary'
                  >
                    {t('adminQuoteDetail.managePayments')}
                  </LocalizedLink>
                </div>
              </div>
            </form>
          </div>

          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.estimateWorkflowKicker')}</div>
              <h3>{t('adminQuoteDetail.estimateBuilderTitle')}</h3>
              <p>{t('adminQuoteDetail.estimateBuilderIntro')}</p>

              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.existingEstimatesLabel')}</span><span>{record.estimates.length}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.latestEstimateLabel')}</span><span>{latestEstimate ? `${latestEstimate.estimate_kind} · ${latestEstimate.status}` : t('adminQuoteDetail.latestEstimateNone')}</span></div>
                <div className='preview-meta-row'><span>{t('adminQuoteDetail.latestTotalLabel')}</span><span>{latestEstimate?.total_amount != null ? `$${Number(latestEstimate.total_amount).toFixed(2)}` : '—'}</span></div>
              </div>

              {record.estimates.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <strong style={{ fontSize: 13 }}>{t('adminQuoteDetail.estimateHistoryHeading')}</strong>
                  <div className='preview-meta' style={{ marginTop: 8 }}>
                    {record.estimates.map((est) => {
                      const isExpanded = expandedEstimateId === est.id
                      const detail = estimateDetails[est.id]
                      const now = new Date()
                      const expired =
                        est.expires_at &&
                        new Date(est.expires_at) < now &&
                        est.status === 'sent'

                      return (
                        <div key={est.id}>
                          <div className='preview-meta-row'>
                            <span>
                              {est.estimate_kind} · {est.status}
                              {expired ? ` · ${t('adminQuoteDetail.estimateExpiredBadge')}` : ''}
                              {est.expires_at && est.status === 'sent' && !expired
                                ? ` · ${t('adminQuoteDetail.estimateExpiresOn', { date: new Date(est.expires_at).toLocaleDateString() })}`
                                : ''}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {est.total_amount != null ? `$${Number(est.total_amount).toFixed(2)}` : '—'}
                              <button
                                type='button'
                                onClick={() => handleToggleEstimate(est.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  padding: '2px 6px',
                                  textDecoration: 'underline',
                                }}
                              >
                                {isExpanded ? t('adminQuoteDetail.hideAction') : t('adminQuoteDetail.viewAction')}
                              </button>
                            </span>
                          </div>

                          {isExpanded && (
                            <div style={{ paddingLeft: 12, paddingBottom: 8 }}>
                              {!detail ? (
                                <div style={{ fontSize: 13, color: '#888', padding: '4px 0' }}>
                                  {t('adminQuoteDetail.estimateLoading')}
                                </div>
                              ) : detail.items.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#888', padding: '4px 0' }}>
                                  {t('adminQuoteDetail.estimateNoItems')}
                                </div>
                              ) : (
                                <div className='preview-meta' style={{ marginTop: 4 }}>
                                  {detail.items.map((item) => (
                                    <div key={item.id} className='preview-meta-row'>
                                      <span style={{ fontSize: 13 }}>
                                        {t('adminQuoteDetail.estimateLineItem', { type: item.line_type, description: item.description, quantity: item.quantity })}
                                      </span>
                                      <span style={{ fontSize: 13 }}>
                                        ${Number(item.line_total).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  {detail.estimate.customer_visible_notes && (
                                    <div className='preview-meta-row'>
                                      <span style={{ fontSize: 13, fontStyle: 'italic' }}>
                                        {t('adminQuoteDetail.estimateNoteLabel', { note: detail.estimate.customer_visible_notes })}
                                      </span>
                                      <span>—</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className='inline-actions' style={{ marginBottom: 0, marginTop: 18 }}>
                <LocalizedLink
                  href={`/admin/quotes/${quoteId}/estimate`}
                  className='button button-primary'
                >
                  {estimateActionLabel}
                </LocalizedLink>
              </div>
            </div>

            {paymentData ? (
              <AdminPaymentSummaryCard
                quoteId={quoteId}
                paymentData={paymentData}
                compact
              />
            ) : null}

            {paymentData?.repairOrder && Number(paymentData.repairOrder.inspection_deposit_required) > 0 ? (() => {
              const depositAlreadyPaid = depositPaidSuccess || paymentData.payments?.some(
                (p) => p.payment_kind === 'inspection_deposit' && p.status === 'paid'
              )
              return (
                <div className='policy-card'>
                  <div className='kicker'>{t('adminQuoteDetail.depositKicker')}</div>
                  <h3>{t('adminQuoteDetail.depositTitle')}</h3>
                  <p>
                    {t('adminQuoteDetail.depositRequired')} <strong>${Number(paymentData.repairOrder.inspection_deposit_required).toFixed(2)}</strong>
                  </p>
                  {depositAlreadyPaid ? (
                    <div className='notice notice-success' style={{ marginTop: 18 }}>
                      {t('adminQuoteDetail.depositPaidNotice')}
                    </div>
                  ) : (
                    <>
                      {depositPaidError ? (
                        <div className='notice notice-error' style={{ marginTop: 18 }}>{depositPaidError}</div>
                      ) : null}
                      <div className='inline-actions' style={{ marginTop: 18 }}>
                        <button
                          className='button button-primary'
                          onClick={handleMarkDepositPaid}
                          disabled={markingDepositPaid}
                        >
                          {markingDepositPaid ? t('adminQuoteDetail.savingEllipsis') : t('adminQuoteDetail.markDepositPaid')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })() : null}

            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.customerReviewKicker')}</div>
              <h3>{t('adminQuoteDetail.customerReviewTitle')}</h3>
              <div className='notice' style={{ marginTop: 18 }}>
                {reviewPath}
              </div>
              <div className='inline-actions'>
                <LocalizedLink href={reviewPath} className='button button-secondary'>
                  {t('adminQuoteDetail.openReviewPage')}
                </LocalizedLink>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.mailInKicker')}</div>
              <h3>{t('adminQuoteDetail.mailInTitle')}</h3>
              <div className='notice' style={{ marginTop: 18 }}>
                {mailInPath || t('adminQuoteDetail.mailInPlaceholder')}
              </div>
              {mailInPath ? (
                <div className='inline-actions'>
                  <LocalizedLink href={mailInPath} className='button button-secondary'>
                    {t('adminQuoteDetail.openMailInPage')}
                  </LocalizedLink>
                </div>
              ) : null}
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.repairOrderKicker')}</div>
              <h3>{t('adminQuoteDetail.operationsTitle')}</h3>
              <p>{t('adminQuoteDetail.operationsIntro')}</p>
              <div className='inline-actions'>
                <LocalizedLink
                  href={`/admin/quotes/${quoteId}/order`}
                  className='button button-secondary'
                >
                  {t('adminQuoteDetail.manageRepairOrder')}
                </LocalizedLink>
                <LocalizedLink
                  href={paymentsPath}
                  className='button button-secondary'
                >
                  {t('adminQuoteDetail.managePayments')}
                </LocalizedLink>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.pricingRuleKicker')}</div>
              <h3>{t('adminQuoteDetail.pricingRuleTitle')}</h3>
              {record.pricingRule ? (
                <div className='preview-meta'>
                  <div className='preview-meta-row'><span>{t('adminQuoteDetail.pricingRuleModeLabel')}</span><span>{record.pricingRule.price_mode}</span></div>
                  <div className='preview-meta-row'><span>{t('adminQuoteDetail.pricingRulePartGradeLabel')}</span><span>{record.pricingRule.part_grade || '—'}</span></div>
                  <div className='preview-meta-row'><span>{t('adminQuoteDetail.pricingRuleDepositLabel')}</span><span>{record.pricingRule.deposit_amount != null ? `$${Number(record.pricingRule.deposit_amount).toFixed(2)}` : '—'}</span></div>
                  <div className='preview-meta-row'><span>{t('adminQuoteDetail.pricingRuleShippingLabel')}</span><span>{record.pricingRule.return_shipping_fee != null ? `$${Number(record.pricingRule.return_shipping_fee).toFixed(2)}` : '—'}</span></div>
                </div>
              ) : (
                <p>{t('adminQuoteDetail.pricingRuleEmpty')}</p>
              )}
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminQuoteDetail.photosKicker')}</div>
              <h3>{t('adminQuoteDetail.photosTitle')}</h3>
              {!record.photos.length ? <p>{t('adminQuoteDetail.photosEmpty')}</p> : null}
              <div className='grid-2'>
                {record.photos.map((photo) => (
                  <div key={photo.id} className='feature-card'>
                    <span className='mini-chip'>{photo.photo_type || 'photo'}</span>
                    {photo.signed_url ? (
                      <img
                        src={photo.signed_url}
                        alt={photo.photo_type || 'quote photo'}
                        style={{ borderRadius: 18, marginTop: 14 }}
                      />
                    ) : (
                      <div className='notice' style={{ marginTop: 14 }}>
                        {t('adminQuoteDetail.photoPreviewError', { path: photo.storage_path })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function toInputValue(value) {
  return value == null ? '' : String(value)
}
