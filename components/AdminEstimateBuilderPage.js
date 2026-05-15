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

export default function AdminEstimateBuilderPage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminEstimateBuilderInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function AdminEstimateBuilderInner({ quoteId }) {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [record, setRecord] = useState(null)
  const [estimateKind, setEstimateKind] = useState('preliminary')
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
  const [mailInPath, setMailInPath] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadQuote() {
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

        const [customerResult, pricingRuleResult] = await Promise.all([
          quote.customer_id
            ? supabase
                .from('customers')
                .select(
                  'id, first_name, last_name, email, phone, preferred_contact_method'
                )
                .eq('id', quote.customer_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          quote.selected_pricing_rule_id
            ? supabase
                .from('pricing_rules')
                .select('*')
                .eq('id', quote.selected_pricing_rule_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ])

        if (customerResult.error) throw customerResult.error
        if (pricingRuleResult.error) throw pricingRuleResult.error

        const defaultItems = buildDefaultItems(quote, pricingRuleResult.data)

        if (!ignore) {
          setRecord({
            quote,
            customer: customerResult.data,
            pricingRule: pricingRuleResult.data,
            customerName:
              (
                customerResult.data
                  ? [customerResult.data.first_name, customerResult.data.last_name]
                  : [quote.first_name, quote.last_name]
              )
                .filter(Boolean)
                .join(' ') || t('adminEstimateBuilder.guestCustomer'),
          })
          setItems(defaultItems.length ? defaultItems : [EMPTY_ITEM()])
          setShippingAmount(toInputValue(pricingRuleResult.data?.return_shipping_fee))
          setDepositCreditAmount(toInputValue(pricingRuleResult.data?.deposit_amount))
          setWarrantyDays(toInputValue(pricingRuleResult.data?.warranty_days || 90))
          setTurnaroundNote(buildTurnaroundNote(pricingRuleResult.data))
          setCustomerVisibleNotes(quote.quote_summary || '')
          setInternalNotes(quote.internal_notes || '')
          setMailInPath(
            quote.status === 'approved_for_mail_in' ? `/mail-in/${quoteId}` : ''
          )
        }
      } catch (loadError) {
        if (!ignore) setError(loadError.message || t('adminEstimateBuilder.loadFailed'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadQuote()
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
      const response = await fetch(`/admin/api/quotes/${quoteId}/send-estimate`, {
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
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t('adminEstimateBuilder.sendFailed'))

      setSuccess(t('adminEstimateBuilder.successCreated', { id: result.estimateId }))
      setReviewPath(result.reviewPath || `/estimate-review/${quoteId}`)
      setMailInPath(result.mailInPath || '')
      setRecord((current) =>
        current
          ? {
              ...current,
              quote: {
                ...current.quote,
                status: 'estimate_sent',
              },
            }
          : current
      )
    } catch (submitError) {
      setError(submitError.message || t('adminEstimateBuilder.sendFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>{t('adminEstimateBuilder.loading')}</div>
        </div>
      </main>
    )
  }

  if (error && !record) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>{t('adminEstimateBuilder.headingUnableToOpen')}</h1>
            <p>{error}</p>
            <div className='inline-actions'>
              <LocalizedLink href='/admin/quotes' className='button button-secondary'>
                {t('adminEstimateBuilder.backToQuotes')}
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
              <h1 className='quote-title'>{t('adminEstimateBuilder.buildEstimateFor', { name: record.customerName })}</h1>
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
              href={`/admin/quotes/${quoteId}`}
              className='button button-secondary button-compact'
            >
              {t('adminEstimateBuilder.backToQuote')}
            </LocalizedLink>
            <LocalizedLink
              href={`/admin/quotes/${quoteId}/order`}
              className='button button-secondary button-compact'
            >
              {t('adminEstimateBuilder.manageRepairOrder')}
            </LocalizedLink>
          </div>
        </div>

        <div className='grid-2'>
          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.reviewKicker')}</div>
            <h3>{t('adminEstimateBuilder.reviewTitle')}</h3>
            <div className='notice' style={{ marginTop: 18 }}>
              {reviewPath}
            </div>
            <div className='inline-actions'>
              <LocalizedLink href={reviewPath} className='button button-secondary'>
                {t('adminEstimateBuilder.openReviewPage')}
              </LocalizedLink>
            </div>
          </div>

          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.mailInKicker')}</div>
            <h3>{t('adminEstimateBuilder.mailInTitle')}</h3>
            <div className='notice' style={{ marginTop: 18 }}>
              {mailInPath || t('adminEstimateBuilder.mailInPlaceholder')}
            </div>
            {mailInPath ? (
              <div className='inline-actions'>
                <LocalizedLink href={mailInPath} className='button button-secondary'>
                  {t('adminEstimateBuilder.openMailInPage')}
                </LocalizedLink>
              </div>
            ) : null}
          </div>
        </div>

        <form className='page-stack' onSubmit={handleSubmit}>
          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.headerKicker')}</div>
            <h3>{t('adminEstimateBuilder.headerTitle')}</h3>
            <div className='form-grid'>
              <div className='field'>
                <label htmlFor='estimate-kind'>{t('adminEstimateBuilder.estimateTypeLabel')}</label>
                <select
                  id='estimate-kind'
                  value={estimateKind}
                  onChange={(event) => setEstimateKind(event.target.value)}
                >
                  <option value='preliminary'>{t('adminEstimateBuilder.estimateKindPreliminary')}</option>
                  <option value='final'>{t('adminEstimateBuilder.estimateKindFinal')}</option>
                  <option value='revised'>{t('adminEstimateBuilder.estimateKindRevised')}</option>
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
                placeholder={t('adminEstimateBuilder.turnaroundPlaceholder')}
              />
            </div>
          </div>

          <div className='policy-card'>
            <div className='kicker'>{t('adminEstimateBuilder.lineItemsKicker')}</div>
            <h3>{t('adminEstimateBuilder.lineItemsTitle')}</h3>
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
                        placeholder={t('adminEstimateBuilder.descriptionPlaceholder')}
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
                        placeholder={t('adminEstimateBuilder.unitAmountPlaceholder')}
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
              <h3>{t('adminEstimateBuilder.amountsTitle')}</h3>
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
              <h3>{t('adminEstimateBuilder.previewTitle')}</h3>
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
              <h3>{t('adminEstimateBuilder.customerNoteTitle')}</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='customer-visible-notes'>{t('adminEstimateBuilder.customerVisibleNotesLabel')}</label>
                <textarea
                  id='customer-visible-notes'
                  value={customerVisibleNotes}
                  onChange={(event) => setCustomerVisibleNotes(event.target.value)}
                  placeholder={t('adminEstimateBuilder.customerVisibleNotesPlaceholder')}
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
                  placeholder={t('adminEstimateBuilder.internalNotesPlaceholder')}
                />
              </div>
            </div>
          </div>

          {error ? <div className='notice'>{error}</div> : null}
          {success ? <div className='notice'>{success}</div> : null}

          {showConfirm ? (
            <div className='notice notice-warn'>
              <strong style={{ display: 'block', marginBottom: 8 }}>{t('adminEstimateBuilder.confirmSendTitle')}</strong>
              <p style={{ margin: '0 0 12px' }}>
                {t('adminEstimateBuilder.confirmSendBody', { recipient: record.quote.guest_email || record.customerName })}
              </p>
              <div className='inline-actions' style={{ margin: 0 }}>
                <button type='submit' className='button button-primary button-compact' disabled={saving}>
                  {saving ? t('adminEstimateBuilder.sendingEllipsis') : t('adminEstimateBuilder.confirmSendYes')}
                </button>
                <button type='button' className='button button-ghost button-compact' onClick={() => setShowConfirm(false)}>
                  {t('adminEstimateBuilder.confirmCancel')}
                </button>
              </div>
            </div>
          ) : null}

          <div className='inline-actions'>
            <button type='submit' className='button button-primary' disabled={saving}>
              {saving ? t('adminEstimateBuilder.sendingEstimateEllipsis') : t('adminEstimateBuilder.createAndSend')}
            </button>
            <LocalizedLink href={reviewPath} className='button button-secondary'>
              {t('adminEstimateBuilder.openReviewPage')}
            </LocalizedLink>
            <LocalizedLink
              href={`/admin/quotes/${quoteId}/order`}
              className='button button-secondary'
            >
              {t('adminEstimateBuilder.manageRepairOrder')}
            </LocalizedLink>
            {mailInPath ? (
              <LocalizedLink href={mailInPath} className='button button-secondary'>
                {t('adminEstimateBuilder.openMailInPage')}
              </LocalizedLink>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  )
}

function buildDefaultItems(quote, pricingRule) {
  if (quote.preliminary_price_fixed != null) {
    return [
      {
        line_type: 'labor',
        description: quote.quote_summary || `${quote.repair_type_key || 'Repair'} service`,
        quantity: '1',
        unit_amount: String(quote.preliminary_price_fixed),
      },
    ]
  }

  if (pricingRule?.public_price_min != null) {
    return [
      {
        line_type: 'labor',
        description: quote.quote_summary || `${quote.repair_type_key || 'Repair'} service`,
        quantity: '1',
        unit_amount: String(pricingRule.public_price_min),
      },
    ]
  }

  return []
}

function buildTurnaroundNote(pricingRule) {
  if (!pricingRule) return ''
  if (pricingRule.turnaround_min_business_days && pricingRule.turnaround_max_business_days) {
    return `${pricingRule.turnaround_min_business_days}–${pricingRule.turnaround_max_business_days} business days after approval`
  }
  return ''
}

function toInputValue(value) {
  return value == null ? '' : String(value)
}
