'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import QuoteStatusBadge from './QuoteStatusBadge'
import { getSupabaseBrowser } from '../lib/supabase/browser'

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'estimate_sent', label: 'Estimate sent' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'approved_for_mail_in', label: 'Approved for mail-in' },
  { value: 'declined', label: 'Declined' },
  { value: 'archived', label: 'Archived' },
]

export default function AdminQuoteDetailPage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminQuoteDetailInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function AdminQuoteDetailInner({ quoteId }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [record, setRecord] = useState(null)
  const [expandedEstimateId, setExpandedEstimateId] = useState(null)
  const [estimateDetails, setEstimateDetails] = useState({})

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
        if (!quote) throw new Error('Quote request not found.')

        const [photosResult, pricingRuleResult, customerResult, estimatesResult] =
          await Promise.all([
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
              .select('id, estimate_kind, status, total_amount, created_at, sent_at, expires_at')
              .eq('quote_request_id', quote.id)
              .order('created_at', { ascending: false }),
          ])

        if (photosResult.error) throw photosResult.error
        if (pricingRuleResult.error) throw pricingRuleResult.error
        if (customerResult.error) throw customerResult.error
        if (estimatesResult.error) throw estimatesResult.error

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
              .join(' ') || 'Guest customer',
        }

        if (!ignore) {
          setRecord(normalized)
          setStatus(quote.status || 'submitted')
          setQuoteSummary(quote.quote_summary || '')
          setInternalNotes(quote.internal_notes || '')
          setPriceFixed(toInputValue(quote.preliminary_price_fixed))
          setPriceMin(toInputValue(quote.preliminary_price_min))
          setPriceMax(toInputValue(quote.preliminary_price_max))
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Unable to load quote request.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRecord()
    return () => {
      ignore = true
    }
  }, [quoteId])

  const priceDisplay = useMemo(() => {
    if (priceFixed !== '') return `$${Number(priceFixed || 0).toFixed(2)}`
    if (priceMin !== '' && priceMax !== '') {
      return `$${Number(priceMin || 0).toFixed(2)}–$${Number(priceMax || 0).toFixed(2)}`
    }
    return 'Manual review'
  }, [priceFixed, priceMax, priceMin])

  const estimateActionLabel = useMemo(() => {
    if (!record?.estimates?.length) return 'Create Estimate'
    return 'Open Estimate Builder'
  }, [record])

  const latestEstimate = useMemo(() => {
    return record?.estimates?.[0] || null
  }, [record])

  const reviewPath = `/estimate-review/${quoteId}`
  const mailInPath =
    status === 'approved_for_mail_in' ? `/mail-in/${quoteId}` : null

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

      setSuccess('Quote review saved.')
    } catch (saveError) {
      setError(saveError.message || 'Unable to save quote review.')
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
          <div className='policy-card center-card'>Loading quote request…</div>
        </div>
      </main>
    )
  }

  if (error && !record) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card center-card'>
            <div className='kicker'>Admin quote</div>
            <h1>Unable to open quote</h1>
            <p>{error}</p>
            <div className='inline-actions'>
              <Link href='/admin/quotes' className='button button-secondary'>
                Back to quotes
              </Link>
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
                {record.quote.repair_type_key || 'Repair type not set'}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <QuoteStatusBadge status={status} />
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <Link href='/admin/quotes' className='button button-secondary button-compact'>
              Back to queue
            </Link>
            <Link
              href={`/admin/quotes/${quoteId}/estimate`}
              className='button button-primary button-compact'
            >
              {estimateActionLabel}
            </Link>
            <Link
              href={`/admin/quotes/${quoteId}/order`}
              className='button button-secondary button-compact'
            >
              Manage Repair Order
            </Link>
          </div>

          <div className='quote-summary'>
            <div className='quote-summary-card'>
              <strong>Estimate preview</strong>
              <span>{priceDisplay}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>Submitted</strong>
              <span>{new Date(record.quote.created_at).toLocaleString()}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>Preferred contact</strong>
              <span>
                {record.customer?.preferred_contact_method ||
                  record.quote.preferred_contact_method ||
                  'either'}
              </span>
            </div>
          </div>
        </div>

        <div className='grid-2'>
          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>Customer</div>
              <h3>Contact details</h3>
              <div className='preview-meta'>
                <div className='preview-meta-row'><span>Name</span><span>{record.customerName}</span></div>
                <div className='preview-meta-row'><span>Email</span><span>{record.customer?.email || record.quote.guest_email || '—'}</span></div>
                <div className='preview-meta-row'><span>Phone</span><span>{record.customer?.phone || record.quote.guest_phone || '—'}</span></div>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Issue details</div>
              <h3>Customer notes</h3>
              <p>{record.quote.issue_description || 'No issue description provided.'}</p>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>Powers on</span><span>{record.quote.powers_on || '—'}</span></div>
                <div className='preview-meta-row'><span>Charges</span><span>{record.quote.charges || '—'}</span></div>
                <div className='preview-meta-row'><span>Liquid damage</span><span>{record.quote.liquid_damage || '—'}</span></div>
                <div className='preview-meta-row'><span>Prior repairs</span><span>{record.quote.prior_repairs || '—'}</span></div>
                <div className='preview-meta-row'><span>Preserve data</span><span>{record.quote.preserve_data || '—'}</span></div>
              </div>
            </div>

            <form className='policy-card' onSubmit={handleSave}>
              <div className='kicker'>Review actions</div>
              <h3>Update quote</h3>
              <div className='page-stack' style={{ marginTop: 18 }}>
                <div className='field'>
                  <label htmlFor='admin-status'>Status</label>
                  <select
                    id='admin-status'
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='field'>
                  <label htmlFor='admin-summary'>Customer-facing summary</label>
                  <textarea
                    id='admin-summary'
                    value={quoteSummary}
                    onChange={(event) => setQuoteSummary(event.target.value)}
                  />
                </div>

                <div className='form-grid'>
                  <div className='field'>
                    <label htmlFor='admin-price-fixed'>Fixed price</label>
                    <input
                      id='admin-price-fixed'
                      value={priceFixed}
                      onChange={(event) => setPriceFixed(event.target.value)}
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='admin-price-min'>Price min</label>
                    <input
                      id='admin-price-min'
                      value={priceMin}
                      onChange={(event) => setPriceMin(event.target.value)}
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='admin-price-max'>Price max</label>
                    <input
                      id='admin-price-max'
                      value={priceMax}
                      onChange={(event) => setPriceMax(event.target.value)}
                    />
                  </div>
                </div>

                <div className='field'>
                  <label htmlFor='admin-internal-notes'>Internal notes</label>
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
                    {saving ? 'Saving…' : 'Save review'}
                  </button>
                  <Link
                    href={`/admin/quotes/${quoteId}/estimate`}
                    className='button button-secondary'
                  >
                    {estimateActionLabel}
                  </Link>
                  <Link
                    href={`/admin/quotes/${quoteId}/order`}
                    className='button button-secondary'
                  >
                    Manage Repair Order
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>Estimate workflow</div>
              <h3>Estimate builder</h3>
              <p>
                Move this reviewed quote into the estimate builder to create line items,
                shipping, discount logic, and send a real estimate record to the customer flow.
              </p>

              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>Existing estimates</span><span>{record.estimates.length}</span></div>
                <div className='preview-meta-row'><span>Latest estimate</span><span>{latestEstimate ? `${latestEstimate.estimate_kind} · ${latestEstimate.status}` : 'None yet'}</span></div>
                <div className='preview-meta-row'><span>Latest total</span><span>{latestEstimate?.total_amount != null ? `$${Number(latestEstimate.total_amount).toFixed(2)}` : '—'}</span></div>
              </div>

              {record.estimates.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <strong style={{ fontSize: 13 }}>Estimate history</strong>
                  <div className='preview-meta' style={{ marginTop: 8 }}>
                    {record.estimates.map((est) => {
                      const isExpanded = expandedEstimateId === est.id
                      const detail = estimateDetails[est.id]
                      const now = new Date()
                      const expired = est.expires_at && new Date(est.expires_at) < now && est.status === 'sent'
                      return (
                        <div key={est.id}>
                          <div className='preview-meta-row'>
                            <span>
                              {est.estimate_kind} · {est.status}
                              {expired ? ' · EXPIRED' : ''}
                              {est.expires_at && est.status === 'sent' && !expired
                                ? ` · expires ${new Date(est.expires_at).toLocaleDateString()}`
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
                                {isExpanded ? 'hide' : 'view'}
                              </button>
                            </span>
                          </div>
                          {isExpanded && (
                            <div style={{ paddingLeft: 12, paddingBottom: 8 }}>
                              {!detail ? (
                                <div style={{ fontSize: 13, color: '#888', padding: '4px 0' }}>Loading…</div>
                              ) : detail.items.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#888', padding: '4px 0' }}>No line items.</div>
                              ) : (
                                <div className='preview-meta' style={{ marginTop: 4 }}>
                                  {detail.items.map((item) => (
                                    <div key={item.id} className='preview-meta-row'>
                                      <span style={{ fontSize: 13 }}>
                                        [{item.line_type}] {item.description} × {item.quantity}
                                      </span>
                                      <span style={{ fontSize: 13 }}>
                                        ${Number(item.line_total).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  {detail.estimate.customer_visible_notes && (
                                    <div className='preview-meta-row'>
                                      <span style={{ fontSize: 13, fontStyle: 'italic' }}>
                                        Note: {detail.estimate.customer_visible_notes}
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
                <Link
                  href={`/admin/quotes/${quoteId}/estimate`}
                  className='button button-primary'
                >
                  {estimateActionLabel}
                </Link>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Customer review link</div>
              <h3>Review page</h3>
              <div className='notice' style={{ marginTop: 18 }}>
                {reviewPath}
              </div>
              <div className='inline-actions'>
                <Link href={reviewPath} className='button button-secondary'>
                  Open Review Page
                </Link>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Mail-in instructions</div>
              <h3>Post-approval page</h3>
              <div className='notice' style={{ marginTop: 18 }}>
                {mailInPath || 'This link becomes active after the estimate is approved.'}
              </div>
              {mailInPath ? (
                <div className='inline-actions'>
                  <Link href={mailInPath} className='button button-secondary'>
                    Open Mail-In Page
                  </Link>
                </div>
              ) : null}
            </div>

            <div className='policy-card'>
              <div className='kicker'>Repair order</div>
              <h3>Operations workflow</h3>
              <p>
                Once the device is approved and mailed in, use the repair order page to update
                intake, inspection, repair progress, and return shipment tracking.
              </p>
              <div className='inline-actions'>
                <Link
                  href={`/admin/quotes/${quoteId}/order`}
                  className='button button-secondary'
                >
                  Manage Repair Order
                </Link>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Pricing rule</div>
              <h3>Matched catalog rule</h3>
              {record.pricingRule ? (
                <div className='preview-meta'>
                  <div className='preview-meta-row'><span>Mode</span><span>{record.pricingRule.price_mode}</span></div>
                  <div className='preview-meta-row'><span>Part grade</span><span>{record.pricingRule.part_grade || '—'}</span></div>
                  <div className='preview-meta-row'><span>Deposit</span><span>{record.pricingRule.deposit_amount != null ? `$${Number(record.pricingRule.deposit_amount).toFixed(2)}` : '—'}</span></div>
                  <div className='preview-meta-row'><span>Shipping</span><span>{record.pricingRule.return_shipping_fee != null ? `$${Number(record.pricingRule.return_shipping_fee).toFixed(2)}` : '—'}</span></div>
                </div>
              ) : (
                <p>No pricing rule is linked to this quote request yet.</p>
              )}
            </div>

            <div className='policy-card'>
              <div className='kicker'>Photos</div>
              <h3>Uploaded images</h3>
              {!record.photos.length ? <p>No photos uploaded.</p> : null}
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
                        Could not generate preview. Path: {photo.storage_path}
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