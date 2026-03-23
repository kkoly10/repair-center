'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'

const STATUS_OPTIONS = [
  'awaiting_mail_in',
  'in_transit_to_shop',
  'received',
  'inspection',
  'awaiting_final_approval',
  'approved',
  'waiting_parts',
  'repairing',
  'testing',
  'awaiting_balance_payment',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'declined',
  'returned_unrepaired',
]

function formatStatusLabel(status) {
  return status
    ?.split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function AdminRepairOrderPage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminRepairOrderInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function AdminRepairOrderInner({ quoteId }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [record, setRecord] = useState(null)

  const [status, setStatus] = useState('awaiting_mail_in')
  const [customerNote, setCustomerNote] = useState('')
  const [carrier, setCarrier] = useState('')
  const [serviceLevel, setServiceLevel] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [shipmentStatus, setShipmentStatus] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadOrder() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/admin/api/quotes/${quoteId}/order`, {
          cache: 'no-store',
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load repair order.')

        if (!ignore) {
          setRecord(result)
          setStatus(result.order?.current_status || 'awaiting_mail_in')

          const returnShipment = (result.shipments || []).find(
            (item) => item.shipment_type === 'return'
          )

          setCarrier(returnShipment?.carrier || '')
          setServiceLevel(returnShipment?.service_level || '')
          setTrackingNumber(returnShipment?.tracking_number || '')
          setTrackingUrl(returnShipment?.tracking_url || '')
          setShipmentStatus(returnShipment?.status || '')
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Unable to load repair order.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadOrder()
    return () => {
      ignore = true
    }
  }, [quoteId])

  const currentStatusLabel = useMemo(
    () => formatStatusLabel(status),
    [status]
  )

  const revisedEstimatePath = `/admin/quotes/${quoteId}/revised-estimate`

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/admin/api/quotes/${quoteId}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          customerNote,
          carrier,
          serviceLevel,
          trackingNumber,
          trackingUrl,
          shipmentStatus,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to update repair order.')

      setSuccess(`Repair order updated to ${formatStatusLabel(result.currentStatus)}.`)
      setCustomerNote('')

      const refreshResponse = await fetch(`/admin/api/quotes/${quoteId}/order`, {
        cache: 'no-store',
      })
      const refreshResult = await refreshResponse.json()
      if (refreshResponse.ok) {
        setRecord(refreshResult)
        setStatus(refreshResult.order?.current_status || status)
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to update repair order.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>Loading repair order…</div>
        </div>
      </main>
    )
  }

  if (error && !record) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>Unable to open repair order</h1>
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
              <h1 className='quote-title'>
                {record.customer.name || 'Customer'} · Repair Order
              </h1>
              <p className='muted'>
                {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')} ·{' '}
                {record.quote.repair_type_key || 'Repair type not set'}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <span className='price-chip'>{currentStatusLabel}</span>
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <Link
              href={`/admin/quotes/${quoteId}`}
              className='button button-secondary button-compact'
            >
              Back to Quote
            </Link>
            <Link
              href={`/track/${quoteId}`}
              className='button button-secondary button-compact'
            >
              Open Customer Tracking
            </Link>
            <Link
              href={revisedEstimatePath}
              className='button button-primary button-compact'
            >
              Send Revised Estimate
            </Link>
          </div>

          <div className='quote-summary'>
            <div className='quote-summary-card'>
              <strong>Order number</strong>
              <span>{record.order?.order_number || 'Will be created on save'}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>Quote status</strong>
              <span>{record.quote.status}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>Current stage</strong>
              <span>{currentStatusLabel}</span>
            </div>
          </div>
        </div>

        <div className='grid-2'>
          <form className='page-stack' onSubmit={handleSubmit}>
            <div className='policy-card'>
              <div className='kicker'>Repair status</div>
              <h3>Update repair progress</h3>

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='repair-status'>Current status</label>
                <select
                  id='repair-status'
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='customer-note'>Customer-visible note</label>
                <textarea
                  id='customer-note'
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder='Example: Device received and checked into intake.'
                />
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Return shipment</div>
              <h3>Optional shipping details</h3>

              <div className='form-grid' style={{ marginTop: 18 }}>
                <div className='field'>
                  <label htmlFor='carrier'>Carrier</label>
                  <input
                    id='carrier'
                    value={carrier}
                    onChange={(event) => setCarrier(event.target.value)}
                    placeholder='UPS'
                  />
                </div>
                <div className='field'>
                  <label htmlFor='service-level'>Service level</label>
                  <input
                    id='service-level'
                    value={serviceLevel}
                    onChange={(event) => setServiceLevel(event.target.value)}
                    placeholder='Ground'
                  />
                </div>
                <div className='field'>
                  <label htmlFor='tracking-number'>Tracking number</label>
                  <input
                    id='tracking-number'
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    placeholder='1Z...'
                  />
                </div>
                <div className='field'>
                  <label htmlFor='shipment-status'>Shipment status</label>
                  <input
                    id='shipment-status'
                    value={shipmentStatus}
                    onChange={(event) => setShipmentStatus(event.target.value)}
                    placeholder='label_created'
                  />
                </div>
              </div>

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='tracking-url'>Tracking URL</label>
                <input
                  id='tracking-url'
                  value={trackingUrl}
                  onChange={(event) => setTrackingUrl(event.target.value)}
                  placeholder='https://...'
                />
              </div>
            </div>

            {error ? <div className='notice'>{error}</div> : null}
            {success ? <div className='notice'>{success}</div> : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={saving}>
                {saving ? 'Saving…' : 'Save Repair Update'}
              </button>
              <Link href={revisedEstimatePath} className='button button-secondary'>
                Send Revised Estimate
              </Link>
            </div>
          </form>

          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>Final approval workflow</div>
              <h3>Use when intake changes the quote</h3>
              <p>
                If inspection reveals extra damage, hidden defects, or additional labor,
                send a revised estimate and move the repair into final customer approval.
              </p>
              <div className='inline-actions'>
                <Link href={revisedEstimatePath} className='button button-primary'>
                  Open Revised Estimate Builder
                </Link>
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Status history</div>
              <h3>Customer-visible timeline</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                {(record.history || []).length ? (
                  record.history.map((item) => (
                    <div key={item.id} className='preview-meta-row'>
                      <span>
                        {formatStatusLabel(item.new_status)}
                        {item.note ? ` · ${item.note}` : ''}
                      </span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className='preview-meta-row'>
                    <span>No timeline entries yet.</span>
                    <span>—</span>
                  </div>
                )}
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Shipment records</div>
              <h3>Return shipping</h3>
              <div className='preview-meta' style={{ marginTop: 18 }}>
                {(record.shipments || []).length ? (
                  record.shipments.map((shipment) => (
                    <div key={shipment.id} className='preview-meta-row'>
                      <span>
                        {shipment.shipment_type} · {shipment.carrier || 'Carrier pending'}
                        {shipment.tracking_number ? ` · ${shipment.tracking_number}` : ''}
                      </span>
                      <span>{shipment.status || 'Pending'}</span>
                    </div>
                  ))
                ) : (
                  <div className='preview-meta-row'>
                    <span>No shipments recorded yet.</span>
                    <span>—</span>
                  </div>
                )}
              </div>
            </div>

            <div className='policy-card'>
              <div className='kicker'>Quick links</div>
              <h3>Customer pages</h3>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}