'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import QuoteStatusBadge from './QuoteStatusBadge'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { getSupabaseBrowser } from '../lib/supabase/browser'

const EMPTY_ITEM = () => ({
  line_type: 'labor',
  description: '',
  quantity: '1',
  unit_amount: '',
})

export default function AdminRevisedEstimatePage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminRevisedEstimateInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function AdminRevisedEstimateInner({ quoteId }) {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [record, setRecord] = useState(null)

  const [estimateKind, setEstimateKind] = useState('revised')
  const [items, setItems] = useState([EMPTY_ITEM()])
  const [shippingAmount, setShippingAmount] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [depositCreditAmount, setDepositCreditAmount] = useState('')
  const [warrantyDays, setWarrantyDays] = useState('90')
  const [turnaroundNote, setTurnaroundNote] = useState('')
  const [customerVisibleNotes, setCustomerVisibleNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [reviewPath, setReviewPath] = useState(`/estimate-review/${quoteId}`)
  const [trackingPath, setTrackingPath] = useState(`/track/${quoteId}`)

  useEffect(() => {
    let ignore = false

    async function loadData() {
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
        if (!quote) throw new Error(t('adminEstimateBuilder.quoteNotFound'))

        const [customerResult, latestEstimateResult] = await Promise.all([
          quote.customer_id
            ? supabase
                .from('customers')
                .select('id, first_name, last_name, email, phone')
                .eq('id', quote.customer_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from('quote_estimates')
            .select('*')
            .eq('quote_request_id', quote.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        if (customerResult.error) throw customerResult.error
        if (latestEstimateResult.error) throw latestEstimateResult.error

        let latestItems = []

        if (latestEstimateResult.data?.id) {
          const { data: estimateItems, error: estimateItemsError } = await supabase
            .from('quote_estimate_items')
            .select('*')
            .eq('estimate_id', latestEstimateResult.data.id)
            .order('created_at', { ascending: true })

          if (estimateItemsError) throw estimateItemsError
          latestItems = estimateItems || []
        }

        const editableItems = latestItems
          .filter((item) => ['labor', 'part', 'fee'].includes(item.line_type))
          .map((item) => ({
            line_type: item.line_type || 'labor',
            description: item.description || '',
            quantity: String(item.quantity || 1),
            unit_amount: String(item.unit_amount || ''),
          }))

        const latestEstimate = latestEstimateResult.data

        if (!ignore) {
          setRecord({
            quote,
            customer: customerResult.data,
            latestEstimate,
            customerName:
              (
                customerResult.data
                  ? [customerResult.data.first_name, customerResult.data.last_name]
                  : [quote.first_name, quote.last_name]
              )
                .filter(Boolean)
                .join(' ') || t('adminEstimateBuilder.guestCustomer'),
          })

          setItems(editableItems.length ? editableItems : [EMPTY_ITEM()])
          setShippingAmount(toInputValue(latestEstimate?.shipping_amount))
          setTaxAmount(toInputValue(latestEstimate?.tax_amount))
          setDiscountAmount(toInputValue(latestEstimate?.discount_amount))
          setDepositCreditAmount(toInputValue(latestEstimate?.deposit_credit_amount))
          setWarrantyDays(toInputValue(latestEstimate?.warranty_days || 90))
          setTurnaroundNote(latestEstimate?.turnaround_note || '')
          setCustomerVisibleNotes(latestEstimate?.customer_visible_notes || quote.quote_summary || '')
          setInternalNotes(latestEstimate?.internal_notes || quote.internal_notes || '')
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || t('adminEstimateBuilder.revisedLoadFailed'))
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [quoteId, t])

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0)
        const unitAmount = Number(item.unit_amount || 0)
        if (!quantity || !unitAmount) return sum
        return sum + quantity * unitAmount
      }, 0),
    [items]
  )

  const total = useMemo(() => {
    return (
      subtotal +
      Number(shippingAmount || 0) +
      Number(taxAmount || 0) -
      Number(discountAmount || 0) -
      Number(depositCreditAmount || 0)
    )
  }, [subtotal, shippingAmount, taxAmount, discountAmount, depositCreditAmount])

  const updateItem = (index, key, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    )
  }

  const addItem = () => {
    setItems((current) => [...current, EMPTY_ITEM()])
  }

  const removeItem = (index) => {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!record) return

    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setShowConfirm(false)
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `/admin/api/quotes/${quoteId}/revised-estimate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            estimateKind,
            items: items.map((item) => ({
              line_type: item.line_type,
              description: item.description,
              quantity: Number(item.quantity || 0),
              unit_amount: Number(item.unit_amount || 0),
            })),
            shippingAmount: Number(shippingAmount || 0),
            taxAmount: Number(taxAmount || 0),
            discountAmount: Number(discountAmount || 0),
            depositCreditAmount: Number(depositCreditAmount || 0),
            warrantyDays: Number(warrantyDays || 0),
            turnaroundNote,
            customerVisibleNotes,
            internalNotes,
          }),
        }
      )

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t('adminEstimateBuilder.revisedSendFailed'))

      setSuccess(t('adminEstimateBuilder.revisedSuccess', { id: result.estimateId }))
      setReviewPath(result.reviewPath || `/estimate-review/${quoteId}`)
      setTrackingPath(result.trackingPath || `/track/${quoteId}`)
      setRecord((current) =>
        current
          ? {
              ...current,
              quote: {
                ...current.quote,
                status: 'awaiting_customer',
              },
            }
          : current
      )
    } catch (submitError) {
      setError(submitError.message || t('adminEstimateBuilder.revisedSendFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>{t('adminEstimateBuilder.revisedLoading')}</div>
        </div>
      </main>
    )
  }

  if (error && !record) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>{t('adminEstimateBuilder.revisedHeadingUnableToOpen')}</h1>
            <p>{error}</p>
            <div className='inline-actions'>
              <LocalizedLink href={`/admin/quotes/${quoteId}/order`} className='button button-secondary'>
                {t('adminEstimateBuilder.backToRepairOrder')}
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
              <h1 className='quote-title'>{t('adminEstimateBuilder.revisedEstimateFor', { name: record.customerName })}</h1>
              <p className='muted'>
                {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')} ·{' '}
                {record.quote.repair_type_key || t('adminEstimateBuilder.repairTypeNotSet')}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <QuoteStatusBadge status={record.quote.status} />
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <LocalizedLink
              href={`/admin/quotes/${quoteId}/order`}
              className='button button-secondary button-compact'
            >
              {t('adminEstimateBuilder.backToRepairOrder')}
            </LocalizedLink>
            <LocalizedLink
              href={`/track/${quoteId}`}
              className='button button-secondary button-compact'
            >
              {t('adminEstimateBuilder.openTrackingPage')}
            </LocalizedLink>
          </div>
        </div>

        <div className='grid-2'>
          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.reviewKicker')}</div>
            <h3>{t('adminEstimateBuilder.revisedReviewTitle')}</h3>
            <div className='notice' style={{ marginTop: 18 }}>{reviewPath}</div>
            <div className='inline-actions'>
              <LocalizedLink href={reviewPath} className='button button-secondary'>
                {t('adminEstimateBuilder.openReviewPage')}
              </LocalizedLink>
            </div>
          </div>

          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.trackingKicker')}</div>
            <h3>{t('adminEstimateBuilder.trackingTitle')}</h3>
            <div className='notice' style={{ marginTop: 18 }}>{trackingPath}</div>
            <div className='inline-actions'>
              <LocalizedLink href={trackingPath} className='button button-secondary'>
                {t('adminEstimateBuilder.openTrackingPage')}
              </LocalizedLink>
            </div>
          </div>
        </div>

        <form className='page-stack' onSubmit={handleSubmit}>
          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.approvalKicker')}</div>
            <h3>{t('adminEstimateBuilder.approvalTitle')}</h3>
            <div className='form-grid'>
              <div className='field'>
                <label htmlFor='estimate-kind'>{t('adminEstimateBuilder.estimateTypeLabel')}</label>
                <select
                  id='estimate-kind'
                  value={estimateKind}
                  onChange={(event) => setEstimateKind(event.target.value)}
                >
                  <option value='revised'>{t('adminEstimateBuilder.estimateKindRevised')}</option>
                  <option value='final'>{t('adminEstimateBuilder.estimateKindFinal')}</option>
                </select>
              </div>
              <div className='field'>
                <label htmlFor='warranty-days'>{t('adminEstimateBuilder.warrantyDaysLabel')}</label>
                <input
                  id='warranty-days'
                  value={warrantyDays}
                  onChange={(event) => setWarrantyDays(event.target.value)}
                />
              </div>
            </div>

            <div className='field' style={{ marginTop: 14 }}>
              <label htmlFor='turnaround-note'>{t('adminEstimateBuilder.turnaroundLabel')}</label>
              <input
                id='turnaround-note'
                value={turnaroundNote}
                onChange={(event) => setTurnaroundNote(event.target.value)}
                placeholder={t('adminEstimateBuilder.revisedTurnaroundPlaceholder')}
              />
            </div>
          </div>

          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.lineItemsKicker')}</div>
            <h3>{t('adminEstimateBuilder.revisedLineItemsTitle')}</h3>

            <div className='page-stack' style={{ marginTop: 18 }}>
              {items.map((item, index) => (
                <div key={index} className='feature-card'>
                  <div className='form-grid'>
                    <div className='field'>
                      <label>{t('adminEstimateBuilder.lineTypeLabel')}</label>
                      <select
                        value={item.line_type}
                        onChange={(event) =>
                          updateItem(index, 'line_type', event.target.value)
                        }
                      >
                        <option value='labor'>{t('adminEstimateBuilder.lineTypeLabor')}</option>
                        <option value='part'>{t('adminEstimateBuilder.lineTypePart')}</option>
                        <option value='fee'>{t('adminEstimateBuilder.lineTypeFee')}</option>
                      </select>
                    </div>
                    <div className='field'>
                      <label>{t('adminEstimateBuilder.descriptionLabel')}</label>
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(index, 'description', event.target.value)
                        }
                        placeholder={t('adminEstimateBuilder.revisedDescriptionPlaceholder')}
                      />
                    </div>
                    <div className='field'>
                      <label>{t('adminEstimateBuilder.quantityLabel')}</label>
                      <input
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, 'quantity', event.target.value)
                        }
                      />
                    </div>
                    <div className='field'>
                      <label>{t('adminEstimateBuilder.unitAmountLabel')}</label>
                      <input
                        value={item.unit_amount}
                        onChange={(event) =>
                          updateItem(index, 'unit_amount', event.target.value)
                        }
                        placeholder={t('adminEstimateBuilder.revisedUnitAmountPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className='inline-actions' style={{ marginBottom: 0 }}>
                    <button
                      type='button'
                      className='button button-secondary button-compact'
                      onClick={() => removeItem(index)}
                    >
                      {t('adminEstimateBuilder.removeItem')}
                    </button>
                  </div>
                </div>
              ))}

              <div className='inline-actions'>
                <button
                  type='button'
                  className='button button-secondary'
                  onClick={addItem}
                >
                  {t('adminEstimateBuilder.addLineItem')}
                </button>
              </div>
            </div>
          </div>

          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>{t('adminEstimateBuilder.amountsKicker')}</div>
              <h3>{t('adminEstimateBuilder.revisedAmountsTitle')}</h3>
              <div className='page-stack' style={{ marginTop: 18 }}>
                <div className='field'>
                  <label htmlFor='shipping-amount'>{t('adminEstimateBuilder.shippingLabel')}</label>
                  <input
                    id='shipping-amount'
                    value={shippingAmount}
                    onChange={(event) => setShippingAmount(event.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='tax-amount'>{t('adminEstimateBuilder.taxLabel')}</label>
                  <input
                    id='tax-amount'
                    value={taxAmount}
                    onChange={(event) => setTaxAmount(event.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='discount-amount'>{t('adminEstimateBuilder.discountLabel')}</label>
                  <input
                    id='discount-amount'
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='deposit-credit-amount'>{t('adminEstimateBuilder.depositCreditLabel')}</label>
                  <input
                    id='deposit-credit-amount'
                    value={depositCreditAmount}
                    onChange={(event) => setDepositCreditAmount(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminEstimateBuilder.previewKicker')}</div>
              <h3>{t('adminEstimateBuilder.revisedPreviewTitle')}</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>{t('adminEstimateBuilder.subtotalLabel')}</span><span>${subtotal.toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>{t('adminEstimateBuilder.shippingPreviewLabel')}</span><span>${Number(shippingAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>{t('adminEstimateBuilder.taxPreviewLabel')}</span><span>${Number(taxAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>{t('adminEstimateBuilder.discountPreviewLabel')}</span><span>-${Number(discountAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>{t('adminEstimateBuilder.depositCreditPreviewLabel')}</span><span>-${Number(depositCreditAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>{t('adminEstimateBuilder.totalLabel')}</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>{t('adminEstimateBuilder.customerNoteKicker')}</div>
              <h3>{t('adminEstimateBuilder.revisedCustomerNoteTitle')}</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='customer-visible-notes'>{t('adminEstimateBuilder.customerVisibleNotesLabel')}</label>
                <textarea
                  id='customer-visible-notes'
                  value={customerVisibleNotes}
                  onChange={(event) => setCustomerVisibleNotes(event.target.value)}
                  placeholder={t('adminEstimateBuilder.revisedCustomerVisibleNotesPlaceholder')}
                />
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>{t('adminEstimateBuilder.internalNoteKicker')}</div>
              <h3>{t('adminEstimateBuilder.internalNoteTitle')}</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='internal-notes'>{t('adminEstimateBuilder.internalNotesLabel')}</label>
                <textarea
                  id='internal-notes'
                  value={internalNotes}
                  onChange={(event) => setInternalNotes(event.target.value)}
                  placeholder={t('adminEstimateBuilder.revisedInternalNotesPlaceholder')}
                />
              </div>
            </div>
          </div>

          {error ? <div className='notice'>{error}</div> : null}
          {success ? <div className='notice'>{success}</div> : null}

          {showConfirm ? (
            <div className='notice notice-warn'>
              <strong style={{ display: 'block', marginBottom: 8 }}>{t('adminEstimateBuilder.confirmRevisedSendTitle')}</strong>
              <p style={{ margin: '0 0 12px' }}>
                {t('adminEstimateBuilder.confirmRevisedSendBody', { recipient: record.quote.guest_email || record.customerName })}
              </p>
              <div className='inline-actions' style={{ margin: 0 }}>
                <button type='submit' className='button button-primary button-compact' disabled={saving}>
                  {saving ? t('adminEstimateBuilder.sendingEllipsis') : t('adminEstimateBuilder.confirmRevisedSendYes')}
                </button>
                <button type='button' className='button button-ghost button-compact' onClick={() => setShowConfirm(false)}>
                  {t('adminEstimateBuilder.confirmCancel')}
                </button>
              </div>
            </div>
          ) : null}

          <div className='inline-actions'>
            <button type='submit' className='button button-primary' disabled={saving}>
              {saving ? t('adminEstimateBuilder.sendingEllipsis') : t('adminEstimateBuilder.sendRevised')}
            </button>
            <LocalizedLink href={reviewPath} className='button button-secondary'>
              {t('adminEstimateBuilder.openReviewPage')}
            </LocalizedLink>
            <LocalizedLink href={trackingPath} className='button button-secondary'>
              {t('adminEstimateBuilder.openTrackingPage')}
            </LocalizedLink>
          </div>
        </form>
      </div>
    </main>
  )
}

function toInputValue(value) {
  return value == null ? '' : String(value)
}
