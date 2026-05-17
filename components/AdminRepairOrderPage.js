'use client'

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
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
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
  const t = useT()
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

  const [sendingIntakeConfirm, setSendingIntakeConfirm] = useState(false)
  const [intakeConfirmSent, setIntakeConfirmSent] = useState(false)
  const [intakeConfirmError, setIntakeConfirmError] = useState('')

  const [requestingBalance, setRequestingBalance] = useState(false)
  const [requestBalanceError, setRequestBalanceError] = useState('')
  const [requestBalanceSuccess, setRequestBalanceSuccess] = useState('')

  const [refundOpen, setRefundOpen] = useState(false)
  const [refundPaymentId, setRefundPaymentId] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [refundError, setRefundError] = useState('')
  const [refundSuccess, setRefundSuccess] = useState('')

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
          throw new Error(result.error || t('adminRepairOrder.loadFailed'))
        }

        if (!ignore) {
          setRecord(result)
          setIntakeConfirmSent(!!result.intakeConfirmAlreadySent)
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
          setError(loadError.message || t('adminRepairOrder.loadFailed'))
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadOrder()
    return () => {
      ignore = true
    }
  }, [quoteId, t])


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
  const isWalkIn = record?.quote?.submission_source === 'walk_in'
  const hasCustomerEmail = !!(record?.quote?.guest_email || record?.customer?.email)
  const showIntakeConfirm = isWalkIn && hasCustomerEmail && !intakeConfirmSent && record?.order?.id

  const handleSendReceipt = async () => {
    if (sendingReceipt) return
    setSendingReceipt(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/send-invoice`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) setSuccess(t('adminRepairOrder.receiptSent'))
      else setError(data.error || t('adminRepairOrder.receiptFailed'))
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
        setDepositMarkError(data.error || t('adminRepairOrder.depositMarkFailed'))
      }
    } catch (err) {
      setDepositMarkError(err.message || t('adminRepairOrder.depositMarkFailed'))
    } finally {
      setDepositMarking(false)
    }
  }

  const refundablePayments = useMemo(() => {
    const rows = paymentData?.payments || []
    return rows.filter(
      (p) =>
        p.status === 'paid' &&
        p.payment_kind !== 'refund' &&
        p.provider === 'stripe' &&
        !!p.provider_payment_intent_id &&
        Number(p.amount) > 0
    )
  }, [paymentData])

  const openRefundModal = () => {
    const first = refundablePayments[0]
    setRefundPaymentId(first?.id || '')
    setRefundAmount(first ? Number(first.amount).toFixed(2) : '')
    setRefundReason('')
    setRefundError('')
    setRefundSuccess('')
    setRefundOpen(true)
  }

  const closeRefundModal = () => {
    if (refunding) return
    setRefundOpen(false)
  }

  const handleRefundPaymentChange = (id) => {
    setRefundPaymentId(id)
    const row = refundablePayments.find((p) => p.id === id)
    if (row) setRefundAmount(Number(row.amount).toFixed(2))
  }

  const handleSubmitRefund = async (event) => {
    event.preventDefault()
    if (refunding) return
    setRefunding(true)
    setRefundError('')
    setRefundSuccess('')
    try {
      const parsedDollars = Number(refundAmount)
      if (!Number.isFinite(parsedDollars) || parsedDollars <= 0) {
        setRefundError(t('refund.error'))
        setRefunding(false)
        return
      }
      const amountCents = Math.round(parsedDollars * 100)
      const res = await fetch(`/admin/api/quotes/${quoteId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: refundPaymentId,
          amountCents,
          reason: refundReason,
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setRefundSuccess(t('refund.success', { amount: parsedDollars.toFixed(2) }))
        const payRes = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, { cache: 'no-store' })
        const payResult = await payRes.json().catch(() => null)
        if (payRes.ok && payResult) setPaymentData(payResult)
        setRefundOpen(false)
      } else {
        setRefundError((data && data.error) || t('refund.error'))
      }
    } catch (err) {
      setRefundError(err.message || t('refund.error'))
    } finally {
      setRefunding(false)
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
        setRequestBalanceSuccess(t('adminRepairOrder.balanceRequestSent', { amount: Number(data.amountDue).toFixed(2) }))
        if (data.status && record?.order) {
          setRecord((prev) => ({ ...prev, order: { ...prev.order, current_status: data.status } }))
          setStatus(data.status)
        }
        const payRes = await fetch(`/admin/api/quotes/${quoteId}/payment-summary`, { cache: 'no-store' })
        const payResult = await payRes.json().catch(() => null)
        if (payRes.ok && payResult) setPaymentData(payResult)
      } else {
        setRequestBalanceError(data.error || t('adminRepairOrder.balanceRequestFailed'))
      }
    } catch (err) {
      setRequestBalanceError(err.message || t('adminRepairOrder.balanceRequestFailed'))
    } finally {
      setRequestingBalance(false)
    }
  }

  const handleSendIntakeConfirmation = async () => {
    if (sendingIntakeConfirm) return
    setSendingIntakeConfirm(true)
    setIntakeConfirmError('')
    try {
      const res = await fetch(`/admin/api/orders/${record?.order?.id}/notify-intake`, { method: 'POST' })
      const data = await res.json()
      if (data.ok || res.status === 409) {
        // 409 = already sent — treat as success so button hides correctly
        setIntakeConfirmSent(true)
      } else {
        setIntakeConfirmError(data.error || t('adminRepairOrder.intakeConfirmFailed'))
      }
    } catch (err) {
      setIntakeConfirmError(err.message || t('adminRepairOrder.intakeConfirmFailed'))
    } finally {
      setSendingIntakeConfirm(false)
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
      if (!response.ok) throw new Error(result.error || t('adminRepairOrder.updateFailed'))

      const newStatusLabel = statusPill(result.currentStatus, t).label || formatStatusLabel(result.currentStatus)
      setSuccess(t('adminRepairOrder.updateSuccess', { label: newStatusLabel }))
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
      setError(submitError.message || t('adminRepairOrder.updateFailed'))
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>{t('adminRepairOrder.loading')}</div>
        </div>
      </main>
    )
  }

  if (error && !record) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>{t('adminRepairOrder.headingUnableToOpen')}</h1>
            <p>{error}</p>
            <div className='inline-actions'>
              <LocalizedLink href='/admin/quotes' className='button button-secondary'>
                {t('adminRepairOrder.backToQuotes')}
              </LocalizedLink>
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
                {record.customer.name || t('adminRepairOrder.customerFallback')}{t('adminRepairOrder.repairOrderSuffix')}
              </h1>
              <p className='muted'>
                {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')} ·{' '}
                {record.quote.repair_type_key || t('adminRepairOrder.repairTypeNotSet')}
              </p>
            </div>
            <div className='inline-actions' style={{ margin: 0 }}>
              <span className={statusPill(status, t).cls}>{statusPill(status, t).label}</span>
              <AdminSignOutButton />
            </div>
          </div>

          <div className='inline-actions' style={{ marginTop: 0 }}>
            <LocalizedLink
              href={`/admin/quotes/${quoteId}`}
              className='button button-secondary button-compact'
            >
              {t('adminRepairOrder.backToQuote')}
            </LocalizedLink>
            <LocalizedLink
              href={`/track/${quoteId}`}
              className='button button-secondary button-compact'
            >
              {t('adminRepairOrder.openCustomerTracking')}
            </LocalizedLink>
            <LocalizedLink
              href={revisedEstimatePath}
              className='button button-primary button-compact'
            >
              {t('adminRepairOrder.sendRevisedEstimate')}
            </LocalizedLink>
            {showMarkDepositPaid && (
              <button
                className='button button-compact'
                style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                onClick={handleMarkDepositPaid}
                disabled={depositMarking}
              >
                {depositMarking ? t('adminRepairOrder.markingEllipsis') : t('adminRepairOrder.markDepositPaid', { amount: depositRequired.toFixed(2) })}
              </button>
            )}
            {showRequestFinalBalance && (
              <button
                className='button button-compact'
                style={{ background: '#2d6bff', color: '#fff', border: 'none' }}
                onClick={handleRequestFinalBalance}
                disabled={requestingBalance}
              >
                {requestingBalance ? t('adminRepairOrder.sendingEllipsis') : t('adminRepairOrder.requestFinalBalance', { amount: finalBalanceDue.toFixed(2) })}
              </button>
            )}
            <LocalizedLink
              href={paymentsPath}
              className='button button-secondary button-compact'
            >
              {t('adminRepairOrder.managePayments')}
            </LocalizedLink>
            <LocalizedLink
              href={invoicePath}
              className='button button-secondary button-compact'
              target='_blank'
              rel='noreferrer'
            >
              {t('adminRepairOrder.viewInvoice')}
            </LocalizedLink>
            <button
              className='button button-secondary button-compact'
              onClick={handleSendReceipt}
              disabled={sendingReceipt}
            >
              {sendingReceipt ? t('adminRepairOrder.sendingEllipsis') : t('adminRepairOrder.sendReceipt')}
            </button>
            <button
              type='button'
              className='button button-compact'
              style={{ background: '#b45309', color: '#fff', border: 'none' }}
              onClick={openRefundModal}
              disabled={refunding}
            >
              {t('refund.button')}
            </button>
            {showIntakeConfirm && (
              <button
                className='button button-compact'
                style={{ background: '#0f766e', color: '#fff', border: 'none' }}
                onClick={handleSendIntakeConfirmation}
                disabled={sendingIntakeConfirm}
              >
                {sendingIntakeConfirm ? t('adminRepairOrder.sendingEllipsis') : t('adminRepairOrder.sendIntakeConfirmation')}
              </button>
            )}
          </div>
          {(depositMarkSuccess || depositMarkError || requestBalanceSuccess || requestBalanceError || intakeConfirmSent || intakeConfirmError || refundSuccess) && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {depositMarkSuccess && (
                <div className='notice' style={{ color: '#16a34a' }}>{t('adminRepairOrder.depositMarkedPaid')}</div>
              )}
              {depositMarkError && <div className='notice'>{depositMarkError}</div>}
              {requestBalanceSuccess && (
                <div className='notice' style={{ color: '#16a34a' }}>{requestBalanceSuccess}</div>
              )}
              {requestBalanceError && <div className='notice'>{requestBalanceError}</div>}
              {intakeConfirmSent && <div className='notice' style={{ color: '#0f766e' }}>{t('adminRepairOrder.intakeConfirmSent')}</div>}
              {intakeConfirmError && <div className='notice'>{intakeConfirmError}</div>}
              {refundSuccess && (
                <div className='notice' style={{ color: '#16a34a' }}>{refundSuccess}</div>
              )}
            </div>
          )}

          <div className='quote-summary'>
            <div className='quote-summary-card'>
              <strong>{t('adminRepairOrder.orderNumberLabel')}</strong>
              <span>{record.order?.order_number || t('adminRepairOrder.orderNumberPlaceholder')}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>{t('adminRepairOrder.quoteStatusLabel')}</strong>
              <span>{record.quote.status}</span>
            </div>
            <div className='quote-summary-card'>
              <strong>{t('adminRepairOrder.currentStageLabel')}</strong>
              <span className={statusPill(status, t).cls}>{statusPill(status, t).label}</span>
            </div>
            {depositRequired > 0 && (
              <div className='quote-summary-card'>
                <strong>{t('adminRepairOrder.inspectionDepositLabel')}</strong>
                <span style={{ color: depositPaid ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  ${depositRequired.toFixed(2)} · {depositPaid ? t('adminRepairOrder.paidLabel') : t('adminRepairOrder.unpaidLabel')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='grid-2'>
          <form className='page-stack' onSubmit={handleSubmit}>
            <div className='policy-card'>
              <div className='kicker'>{t('adminRepairOrder.statusKicker')}</div>
              <h3>{t('adminRepairOrder.statusTitle')}</h3>

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='repair-status'>{t('adminRepairOrder.statusFieldLabel')}</label>
                <select
                  id='repair-status'
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => {
                    const pill = statusPill(option, t)
                    return (
                      <option key={option} value={option}>
                        {pill.label || formatStatusLabel(option)}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='customer-note'>{t('adminRepairOrder.customerNoteLabel')}</label>
                <textarea
                  id='customer-note'
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder={t('adminRepairOrder.customerNotePlaceholder')}
                />
              </div>

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='technician-note'>{t('adminRepairOrder.technicianNoteLabel')}</label>
                <textarea
                  id='technician-note'
                  value={technicianNote}
                  onChange={(event) => setTechnicianNote(event.target.value)}
                  placeholder={t('adminRepairOrder.technicianNotePlaceholder')}
                />
              </div>

              {technicians.length > 0 && (
                <div className='field' style={{ marginTop: 18 }}>
                  <label htmlFor='technician-id'>{t('adminRepairOrder.assignedTechnicianLabel')}</label>
                  <select
                    id='technician-id'
                    value={technicianId}
                    onChange={(event) => setTechnicianId(event.target.value)}
                  >
                    <option value=''>{t('adminRepairOrder.unassignedOption')}</option>
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
                <div className='kicker'>{t('adminRepairOrder.unrepairedKicker')}</div>
                <h3>
                  {status === 'beyond_economical_repair'
                    ? t('adminRepairOrder.beyondRepairTitle')
                    : status === 'no_fault_found'
                    ? t('adminRepairOrder.noFaultTitle')
                    : t('adminRepairOrder.unrepairedTitle')}
                </h3>
                <p>
                  {status === 'beyond_economical_repair'
                    ? t('adminRepairOrder.beyondRepairBody')
                    : status === 'no_fault_found'
                    ? t('adminRepairOrder.noFaultBody')
                    : t('adminRepairOrder.unrepairedBody')}
                </p>
              </div>
            )}

            <div className='policy-card'>
              <div className='kicker'>{t('adminRepairOrder.shipmentKicker')}</div>
              <h3>
                {isUnrepairedReturn ? t('adminRepairOrder.shipmentTitleRequired') : t('adminRepairOrder.shipmentTitleOptional')}
              </h3>

              <div className='form-grid' style={{ marginTop: 18 }}>
                <div className='field'>
                  <label htmlFor='carrier'>{t('adminRepairOrder.carrierLabel')}</label>
                  <input
                    id='carrier'
                    value={carrier}
                    onChange={(event) => setCarrier(event.target.value)}
                    placeholder={t('adminRepairOrder.carrierPlaceholder')}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='service-level'>{t('adminRepairOrder.serviceLevelLabel')}</label>
                  <input
                    id='service-level'
                    value={serviceLevel}
                    onChange={(event) => setServiceLevel(event.target.value)}
                    placeholder={t('adminRepairOrder.serviceLevelPlaceholder')}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='tracking-number'>{t('adminRepairOrder.trackingNumberLabel')}</label>
                  <input
                    id='tracking-number'
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    placeholder={t('adminRepairOrder.trackingNumberPlaceholder')}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='shipment-status'>{t('adminRepairOrder.shipmentStatusLabel')}</label>
                  <input
                    id='shipment-status'
                    value={shipmentStatus}
                    onChange={(event) => setShipmentStatus(event.target.value)}
                    placeholder={t('adminRepairOrder.shipmentStatusPlaceholder')}
                  />
                </div>
              </div>

              <div className='field' style={{ marginTop: 18 }}>
                <label htmlFor='tracking-url'>{t('adminRepairOrder.trackingUrlLabel')}</label>
                <input
                  id='tracking-url'
                  value={trackingUrl}
                  onChange={(event) => setTrackingUrl(event.target.value)}
                  placeholder={t('adminRepairOrder.trackingUrlPlaceholder')}
                />
              </div>
            </div>

            {error ? <div className='notice'>{error}</div> : null}
            {success ? <div className='notice'>{success}</div> : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={saving}>
                {saving ? t('adminRepairOrder.savingEllipsis') : t('adminRepairOrder.saveRepairUpdate')}
              </button>
              <LocalizedLink href={revisedEstimatePath} className='button button-secondary'>
                {t('adminRepairOrder.sendRevisedEstimate')}
              </LocalizedLink>
              <LocalizedLink href={paymentsPath} className='button button-secondary'>
                {t('adminRepairOrder.managePayments')}
              </LocalizedLink>
            </div>
          </form>

          <div className='page-stack'>
            <div className='policy-card'>
              <div className='kicker'>{t('adminRepairOrder.finalApprovalKicker')}</div>
              <h3>{t('adminRepairOrder.finalApprovalTitle')}</h3>
              <p>{t('adminRepairOrder.finalApprovalBody')}</p>
              <div className='inline-actions'>
                <LocalizedLink href={revisedEstimatePath} className='button button-primary'>
                  {t('adminRepairOrder.openRevisedBuilder')}
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
              <div className='kicker'>{t('adminRepairOrder.quickLinksKicker')}</div>
              <h3>{t('adminRepairOrder.quickLinksTitle')}</h3>
              <div className='inline-actions'>
                <LocalizedLink href={`/estimate-review/${quoteId}`} className='button button-secondary'>
                  {t('adminRepairOrder.reviewPage')}
                </LocalizedLink>
                <LocalizedLink href={`/mail-in/${quoteId}`} className='button button-secondary'>
                  {t('adminRepairOrder.mailInPage')}
                </LocalizedLink>
                <LocalizedLink href={`/track/${quoteId}`} className='button button-secondary'>
                  {t('adminRepairOrder.trackingPage')}
                </LocalizedLink>
                <LocalizedLink href={paymentsPath} className='button button-secondary'>
                  {t('adminRepairOrder.payments')}
                </LocalizedLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {refundOpen && (
        <div
          role='dialog'
          aria-modal='true'
          onClick={closeRefundModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{t('refund.modalTitle')}</h3>
            {refundablePayments.length === 0 ? (
              <>
                <p className='muted'>{t('refund.noPayments')}</p>
                <div className='inline-actions' style={{ marginTop: 16 }}>
                  <button type='button' className='button button-secondary' onClick={closeRefundModal}>
                    {t('refund.cancel')}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmitRefund} className='page-stack'>
                <div className='field'>
                  <label htmlFor='refund-payment-id'>{t('refund.selectPayment')}</label>
                  <select
                    id='refund-payment-id'
                    value={refundPaymentId}
                    onChange={(event) => handleRefundPaymentChange(event.target.value)}
                  >
                    {refundablePayments.map((p) => {
                      const kindLabel = p.payment_kind === 'inspection_deposit'
                        ? t('adminRepairOrder.inspectionDepositLabel')
                        : p.payment_kind
                      const dateLabel = p.paid_at
                        ? t('refund.paidLabel', { date: new Date(p.paid_at).toLocaleDateString() })
                        : ''
                      return (
                        <option key={p.id} value={p.id}>
                          {kindLabel} · ${Number(p.amount).toFixed(2)} {dateLabel}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div className='field'>
                  <label htmlFor='refund-amount'>{t('refund.amountLabel')}</label>
                  <input
                    id='refund-amount'
                    type='number'
                    step='0.01'
                    min='0.01'
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                  />
                  <p className='muted' style={{ marginTop: 4, fontSize: 12 }}>
                    {t('refund.amountHint')}
                  </p>
                </div>
                <div className='field'>
                  <label htmlFor='refund-reason'>{t('refund.reasonLabel')}</label>
                  <input
                    id='refund-reason'
                    type='text'
                    maxLength={200}
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                  />
                </div>
                {refundError && <div className='notice'>{refundError}</div>}
                <div className='inline-actions'>
                  <button
                    type='submit'
                    className='button button-primary'
                    disabled={refunding || !refundPaymentId}
                  >
                    {refunding ? t('refund.submitting') : t('refund.submit')}
                  </button>
                  <button
                    type='button'
                    className='button button-secondary'
                    onClick={closeRefundModal}
                    disabled={refunding}
                  >
                    {t('refund.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
