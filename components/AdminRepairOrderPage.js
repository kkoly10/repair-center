'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminSignOutButton from './AdminSignOutButton'
import AdminPaymentSummaryCard from './AdminPaymentSummaryCard'
import OrderActivityLog from './repair-order/OrderActivityLog'
import OrderIntakeForm from './repair-order/OrderIntakeForm'
import OrderMessagesSection from './repair-order/OrderMessagesSection'
import OrderPartsSection from './repair-order/OrderPartsSection'
import OrderShipments from './repair-order/OrderShipments'
import OrderStaffNotes from './repair-order/OrderStaffNotes'
import { statusPill } from '../lib/statusPills'

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
  'beyond_economical_repair',
  'no_fault_found',
]

const UNREPAIRED_RETURN_STATUSES = new Set([
  'returned_unrepaired',
  'beyond_economical_repair',
  'no_fault_found',
])

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
  const [paymentData, setPaymentData] = useState(null)

  const [status, setStatus] = useState('awaiting_mail_in')
  const [customerNote, setCustomerNote] = useState('')
  const [technicianNote, setTechnicianNote] = useState('')

  const [carrier, setCarrier] = useState('')
  const [serviceLevel, setServiceLevel] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [shipmentStatus, setShipmentStatus] = useState('')

  const [technicianId, setTechnicianId] = useState('')



  const [depositMarking, setDepositMarking] = useState(false)
  const [depositMarkError, setDepositMarkError] = useState('')
  const [depositMarkSuccess, setDepositMarkSuccess] = useState(false)

  const [requestingBalance, setRequestingBalance] = useState(false)
  const [requestBalanceError, setRequestBalanceError] = useState('')
  const [requestBalanceSuccess, setRequestBalanceSuccess] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadOrder() {
      setLoading(true)
      setError('')

      try {
        const [orderResponse, paymentResponse] = await Promise.all([
          fetch(`/admin/api/quotes/${quoteId}/order`, {
            cache: 'no-store',
          }),
          fetch(`/admin/api/quotes/${quoteId}/payment-summary`, {
            cache: 'no-store',
          }),
        ])

        const result = await orderResponse.json()
        const paymentResult = await paymentResponse.json().catch(() => null)

        if (!orderResponse.ok) {
          throw new Error(result.error || 'Unable to load repair order.')
        }

        if (!ignore) {
          setRecord(result)
          setStatus(result.order?.current_status || 'awaiting_mail_in')
          setTechnicianNote(result.order?.technician_note || '')
          setTechnicianId(result.order?.assigned_technician_user_id || '')

          const returnShipment = (result.shipments || []).find(
            (item) => item.shipment_type === 'return'
          )
          setCarrier(returnShipment?.carrier || '')
          setServiceLevel(returnShipment?.service_level || '')
          setTrackingNumber(returnShipment?.tracking_number || '')
          setTrackingUrl(returnShipment?.tracking_url || '')
          setShipmentStatus(returnShipment?.status || '')

          setPaymentData(paymentResponse.ok ? paymentResult : null)
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


  const [sendingReceipt, setSendingReceipt] = useState(false)

  const isUnrepairedReturn = useMemo(() => UNREPAIRED_RETURN_STATUSES.has(status), [status])
  const revisedEstimatePath = `/admin/quotes/${quoteId}/revised-estimate`
  const paymentsPath = `/admin/quotes/${quoteId}/payments`
  const invoicePath = `/admin/quotes/${quoteId}/invoice`

  const depositRequired = Number(record?.order?.inspection_deposit_required || 0)
  const depositPaid = !!record?.order?.inspection_deposit_paid_at
  const showMarkDepositPaid = depositRequired > 0 && !depositPaid
  const finalBalanceDue = Number(paymentData?.summary?.finalBalanceDue || 0)
  const showRequestFinalBalance = record?.order?.id && finalBalanceDue > 0

  const handleSendReceipt = async () => {
    if (sendingReceipt) return
    setSendingReceipt(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/send-invoice`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) setSuccess('Receipt emailed to customer.')
      else setError(data.error || 'Failed to send receipt.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingReceipt(false)
    }
  }

  const handleMarkDepositPaid = async () => {
    if (depositMarking) return
    setDepositMarking(true)
    setDepositMarkError('')
    setDepositMarkSuccess(false)
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/deposit`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setDepositMarkSuccess(true)
        setRecord((prev) => ({
          ...prev,
          order: { ...prev.order, inspection_deposit_paid_at: new Date().toISOString() },
        }))
        const payRes = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, { cache: 'no-store' })
        const payResult = await payRes.json().catch(() => null)
        if (payRes.ok && payResult) setPaymentData(payResult)
      } else {
        setDepositMarkError(data.error || 'Failed to mark deposit paid.')
      }
    } catch (err) {
      setDepositMarkError(err.message || 'Failed to mark deposit paid.')
    } finally {
      setDepositMarking(false)
    }
  }

  const handleRequestFinalBalance = async () => {
    if (requestingBalance) return
    setRequestingBalance(true)
    setRequestBalanceError('')
    setRequestBalanceSuccess('')
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/request-final-balance`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setRequestBalanceSuccess(`Balance request sent. Amount due: $${Number(data.amountDue).toFixed(2)}`)
        if (data.status && record?.order) {
          setRecord((prev) => ({ ...prev, order: { ...prev.order, current_status: data.status } }))
          setStatus(data.status)
        }
        const payRes = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, { cache: 'no-store' })
        const payResult = await payRes.json().catch(() => null)
        if (payRes.ok && payResult) setPaymentData(payResult)
      } else {
        setRequestBalanceError(data.error || 'Failed to request final balance.')
      }
    } catch (err) {
      setRequestBalanceError(err.message || 'Failed to request final balance.')
    } finally {
      setRequestingBalance(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/admin/api/quotes/${quoteId}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          customerNote,
          technicianNote,
          technicianId: technicianId || null,
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

      const [refreshResponse, paymentRefreshResponse] = await Promise.all([
        fetch(`/admin/api/quotes/${quoteId}/order`, { cache: 'no-store' }),
        fetch(`/admin/api/quotes/${quoteId}/payment-summary`, { cache: 'no-store' }),
      ])

      const refreshResult = await refreshResponse.json()
      const paymentRefreshResult = await paymentRefreshResponse.json().catch(() => null)

      if (refreshResponse.ok) {
        setRecord(refreshResult)
        setStatus(refreshResult.order?.current_status || status)
      }
      if (paymentRefreshResponse.ok) {
        setPaymentData(paymentRefreshResult)
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

  const technicians = record?.technicians || []

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
              <span className={statusPill(status).cls}>{statusPill(status).label}</span>
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
            {showMarkDepositPaid && (
              <button
                className='button button-compact'
                style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                onClick={handleMarkDepositPaid}
                disabled={depositMarking}
              >
                {depositMarking ? 'Marking…' : `Mark Deposit Paid ($${depositRequired.toFixed(2)})`}
              </button>
            )}
            {showRequestFinalBalance && (
              <button
                className='button button-compact'
                style={{ background: '#2d6bff', color: '#fff', border: 'none' }}
                onClick={handleRequestFinalBalance}
                disabled={requestingBalance}
              >
                {requestingBalance ? 'Sending…' : `Request Final Balance ($${finalBalanceDue.toFixed(2)})`}
              </button>
            )}
            <Link
              href={paymentsPath}
              className='button button-secondary button-compact'
            >
              Manage Payments
            </Link>
            <Link
              href={invoicePath}
              className='button button-secondary button-compact'
              target='_blank'
              rel='noreferrer'
            >
              View Invoice
            </Link>
            <button
              className='button button-secondary button-compact'
              onClick={handleSendReceipt}
              disabled={sendingReceipt}
            >
              {sendingReceipt ? 'Sending…' : 'Send Receipt'}
            </button>
          </div>
          {(depositMarkSuccess || depositMarkError || requestBalanceSuccess || requestBalanceError) && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {depositMarkSuccess && (
                <div className='notice' style={{ color: '#16a34a' }}>Deposit marked as paid.</div>
              )}
              {depositMarkError && <div className='notice'>{depositMarkError}</div>}
              {requestBalanceSuccess && (
                <div className='notice' style={{ color: '#16a34a' }}>{requestBalanceSuccess}</div>
              )}
              {requestBalanceError && <div className='notice'>{requestBalanceError}</div>}
            </div>
          )}

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
              <span className={statusPill(status).cls}>{statusPill(status).label}</span>
            </div>
            {depositRequired > 0 && (
              <div className='quote-summary-card'>
                <strong>Inspection deposit</strong>
                <span style={{ color: depositPaid ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  ${depositRequired.toFixed(2)} · {depositPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            )}
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

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='technician-note'>Technician findings (internal only)</label>
                <textarea
                  id='technician-note'
                  value={technicianNote}
                  onChange={(event) => setTechnicianNote(event.target.value)}
                  placeholder='Example: Backlight circuit damaged. Will need board-level repair in addition to screen replacement.'
                />
              </div>

              {technicians.length > 0 && (
                <div className='field' style={{ marginTop: 18 }}>
                  <label htmlFor='technician-id'>Assigned technician</label>
                  <select
                    id='technician-id'
                    value={technicianId}
                    onChange={(event) => setTechnicianId(event.target.value)}
                  >
                    <option value=''>— Unassigned —</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name || tech.id} ({tech.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {isUnrepairedReturn && (
              <div className='policy-card'>
                <div className='kicker'>Return without repair</div>
                <h3>
                  {status === 'beyond_economical_repair'
                    ? 'Beyond economical repair — ship device back'
                    : status === 'no_fault_found'
                    ? 'No fault found — ship device back'
                    : 'Unrepaired return — ship device back'}
                </h3>
                <p>
                  {status === 'beyond_economical_repair'
                    ? 'The repair cost exceeds the value of the device. Record the return shipment details below and notify the customer.'
                    : status === 'no_fault_found'
                    ? 'No defect was found. Record the return shipment details below and notify the customer.'
                    : 'The customer declined the revised estimate. Record the return shipment details below.'}
                </p>
              </div>
            )}

            <div className='policy-card'>
              <div className='kicker'>Return shipment</div>
              <h3>
                {isUnrepairedReturn ? 'Return shipping details (required)' : 'Optional shipping details'}
              </h3>

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
              <Link href={paymentsPath} className='button button-secondary'>
                Manage Payments
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

            {paymentData ? (
              <AdminPaymentSummaryCard
                quoteId={quoteId}
                paymentData={paymentData}
                compact
              />
            ) : null}

            {record.order?.id && (
              <OrderIntakeForm quoteId={quoteId} orderId={record.order.id} />
            )}

            {record.order?.id && <OrderPartsSection orderId={record.order.id} />}

            <OrderActivityLog history={record.history} auditLog={record.auditLog} />

            <OrderShipments shipments={record.shipments} />

            {record.order?.id && (
              <OrderMessagesSection quoteId={quoteId} />
            )}

            {record.order && (
              <OrderStaffNotes
                key={record.order.id}
                orderId={record.order.id}
                initialNotes={record.order.notes || ''}
              />
            )}

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
                <Link href={paymentsPath} className='button button-secondary'>
                  Payments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}