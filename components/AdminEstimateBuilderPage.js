'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import QuoteStatusBadge from './QuoteStatusBadge'
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
        if (!quote) throw new Error('Quote request not found.')

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
                .join(' ') || 'Guest customer',
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
        if (!ignore) setError(loadError.message || 'Unable to load quote request.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadQuote()
    return () => {
      ignore = true
    }
  }, [quoteId])

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!record) return

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
      if (!response.ok) throw new Error(result.error || 'Unable to send estimate.')

      setSuccess(`Estimate ${result.estimateId} created and quote moved to estimate_sent.`)
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
      setError(submitError.message || 'Unable to send estimate.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>Loading estimate builder…</div>
        </div>
      </main>
    )
  }

  if (error && !record) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>Unable to open estimate builder</h1>
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
              <h1 className='quote-title'>Build estimate for {record.customerName}</h1>
              <p className='muted'>
                {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')} ·{' '}
                {record.quote.repair_type_key || 'Repair type not set'}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <QuoteStatusBadge status={record.quote.status} />
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <Link
              href={`/admin/quotes/${quoteId}`}
              className='button button-secondary button-compact'
            >
              Back to quote
            </Link>
            <Link
              href={`/admin/quotes/${quoteId}/order`}
              className='button button-secondary button-compact'
            >
              Manage Repair Order
            </Link>
          </div>
        </div>

        <div className='grid-2'>
          <div className='policy-card'>
            <div className='kicker'>Customer review link</div>
            <h3>Send this estimate review URL</h3>
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
            <div className='kicker'>Mail-in link</div>
            <h3>Available after approval</h3>
            <div className='notice' style={{ marginTop: 18 }}>
              {mailInPath || 'This link becomes active after the customer approves the estimate.'}
            </div>
            {mailInPath ? (
              <div className='inline-actions'>
                <Link href={mailInPath} className='button button-secondary'>
                  Open Mail-In Page
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <form className='page-stack' onSubmit={handleSubmit}>
          <div className='policy-card'>
            <div className='kicker'>Estimate settings</div>
            <h3>Header details</h3>
            <div className='form-grid'>
              <div className='field'>
                <label htmlFor='estimate-kind'>Estimate type</label>
                <select
                  id='estimate-kind'
                  value={estimateKind}
                  onChange={(event) => setEstimateKind(event.target.value)}
                >
                  <option value='preliminary'>Preliminary</option>
                  <option value='final'>Final</option>
                  <option value='revised'>Revised</option>
                </select>
              </div>
              <div className='field'>
                <label htmlFor='warranty-days'>Warranty days</label>
                <input
                  id='warranty-days'
                  value={warrantyDays}
                  onChange={(event) => setWarrantyDays(event.target.value)}
                />
              </div>
            </div>
            <div className='field' style={{ marginTop: 14 }}>
              <label htmlFor='turnaround-note'>Turnaround note</label>
              <input
                id='turnaround-note'
                value={turnaroundNote}
                onChange={(event) => setTurnaroundNote(event.target.value)}
                placeholder='3–5 business days after approval'
              />
            </div>
          </div>

          <div className='policy-card'>
            <div className='kicker'>Line items</div>
            <h3>Services, parts, and fees</h3>
            <div className='page-stack' style={{ marginTop: 18 }}>
              {items.map((item, index) => (
                <div key={index} className='feature-card'>
                  <div className='form-grid'>
                    <div className='field'>
                      <label>Type</label>
                      <select
                        value={item.line_type}
                        onChange={(event) =>
                          updateItem(index, 'line_type', event.target.value)
                        }
                      >
                        <option value='labor'>Labor</option>
                        <option value='part'>Part</option>
                        <option value='fee'>Fee</option>
                      </select>
                    </div>
                    <div className='field'>
                      <label>Description</label>
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(index, 'description', event.target.value)
                        }
                        placeholder='Screen replacement labor'
                      />
                    </div>
                    <div className='field'>
                      <label>Quantity</label>
                      <input
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, 'quantity', event.target.value)
                        }
                      />
                    </div>
                    <div className='field'>
                      <label>Unit amount</label>
                      <input
                        value={item.unit_amount}
                        onChange={(event) =>
                          updateItem(index, 'unit_amount', event.target.value)
                        }
                        placeholder='89'
                      />
                    </div>
                  </div>
                  <div className='inline-actions' style={{ marginBottom: 0 }}>
                    <button
                      type='button'
                      className='button button-secondary button-compact'
                      onClick={() => removeItem(index)}
                    >
                      Remove item
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
                  Add line item
                </button>
              </div>
            </div>
          </div>

          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>Amounts</div>
              <h3>Totals and adjustments</h3>
              <div className='page-stack' style={{ marginTop: 18 }}>
                <div className='field'>
                  <label htmlFor='shipping-amount'>Shipping amount</label>
                  <input
                    id='shipping-amount'
                    value={shippingAmount}
                    onChange={(event) => setShippingAmount(event.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='tax-amount'>Tax amount</label>
                  <input
                    id='tax-amount'
                    value={taxAmount}
                    onChange={(event) => setTaxAmount(event.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='discount-amount'>Discount amount</label>
                  <input
                    id='discount-amount'
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='deposit-credit-amount'>Deposit credit</label>
                  <input
                    id='deposit-credit-amount'
                    value={depositCreditAmount}
                    onChange={(event) => setDepositCreditAmount(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Preview</div>
              <h3>Estimate total</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                <div className='preview-meta-row'><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>Shipping</span><span>${Number(shippingAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>Tax</span><span>${Number(taxAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>Discount</span><span>-${Number(discountAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>Deposit credit</span><span>-${Number(depositCreditAmount || 0).toFixed(2)}</span></div>
                <div className='preview-meta-row'><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          <div className='grid-2'>
            <div className='policy-card'>
              <div className='kicker'>Customer note</div>
              <h3>Visible message</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='customer-visible-notes'>Customer-facing notes</label>
                <textarea
                  id='customer-visible-notes'
                  value={customerVisibleNotes}
                  onChange={(event) => setCustomerVisibleNotes(event.target.value)}
                  placeholder='What the customer should know about this estimate.'
                />
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Internal note</div>
              <h3>Admin-only notes</h3>
              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='internal-notes'>Internal notes</label>
                <textarea
                  id='internal-notes'
                  value={internalNotes}
                  onChange={(event) => setInternalNotes(event.target.value)}
                  placeholder='Supplier, margin, or repair planning notes.'
                />
              </div>
            </div>
          </div>

          {error ? <div className='notice'>{error}</div> : null}
          {success ? <div className='notice'>{success}</div> : null}

          <div className='inline-actions'>
            <button type='submit' className='button button-primary' disabled={saving}>
              {saving ? 'Sending estimate…' : 'Create and send estimate'}
            </button>
            <Link href={reviewPath} className='button button-secondary'>
              Open Review Page
            </Link>
            <Link
              href={`/admin/quotes/${quoteId}/order`}
              className='button button-secondary'
            >
              Manage Repair Order
            </Link>
            {mailInPath ? (
              <Link href={mailInPath} className='button button-secondary'>
                Open Mail-In Page
              </Link>
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