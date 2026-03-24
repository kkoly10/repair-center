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

  // Status + notes
  const [status, setStatus] = useState('awaiting_mail_in')
  const [customerNote, setCustomerNote] = useState('')
  const [technicianNote, setTechnicianNote] = useState('')

  // Return shipment
  const [carrier, setCarrier] = useState('')
  const [serviceLevel, setServiceLevel] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [shipmentStatus, setShipmentStatus] = useState('')

  // Technician assignment
  const [technicianId, setTechnicianId] = useState('')

  // Intake report
  const [intake, setIntake] = useState(null)
  const [intakeSaving, setIntakeSaving] = useState(false)
  const [intakeError, setIntakeError] = useState('')
  const [intakeSuccess, setIntakeSuccess] = useState('')
  const [packageCondition, setPackageCondition] = useState('')
  const [deviceCondition, setDeviceCondition] = useState('')
  const [includedItems, setIncludedItems] = useState('')
  const [imeiOrSerial, setImeiOrSerial] = useState('')
  const [powerTestResult, setPowerTestResult] = useState('')
  const [intakePhotosComplete, setIntakePhotosComplete] = useState(false)
  const [hiddenDamageFound, setHiddenDamageFound] = useState(false)
  const [liquidDamageFound, setLiquidDamageFound] = useState(false)
  const [boardDamageFound, setBoardDamageFound] = useState(false)
  const [intakeNotes, setIntakeNotes] = useState('')

  // Messaging
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [messageInternalOnly, setMessageInternalOnly] = useState(false)
  const [messageSending, setMessageSending] = useState(false)
  const [messageError, setMessageError] = useState('')

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

  useEffect(() => {
    if (!record?.order?.id) return
    let ignore = false

    async function loadIntake() {
      try {
        const response = await fetch(`/admin/api/quotes/${quoteId}/intake`, { cache: 'no-store' })
        const result = await response.json()
        if (!ignore && result.ok) {
          const r = result.intake
          if (r) {
            setIntake(r)
            setPackageCondition(r.package_condition || '')
            setDeviceCondition(r.device_condition || '')
            setIncludedItems(r.included_items || '')
            setImeiOrSerial(r.imei_or_serial || '')
            setPowerTestResult(r.power_test_result || '')
            setIntakePhotosComplete(r.intake_photos_complete || false)
            setHiddenDamageFound(r.hidden_damage_found || false)
            setLiquidDamageFound(r.liquid_damage_found || false)
            setBoardDamageFound(r.board_damage_found || false)
            setIntakeNotes(r.notes || '')
          }
        }
      } catch {
        // non-blocking
      }
    }

    async function loadMessages() {
      setMessagesLoading(true)
      try {
        const response = await fetch(`/admin/api/quotes/${quoteId}/messages`, { cache: 'no-store' })
        const result = await response.json()
        if (!ignore && result.ok) {
          setMessages(result.messages || [])
        }
      } catch {
        // non-blocking
      } finally {
        if (!ignore) setMessagesLoading(false)
      }
    }

    loadIntake()
    loadMessages()

    return () => {
      ignore = true
    }
  }, [quoteId, record?.order?.id])

  const currentStatusLabel = useMemo(() => formatStatusLabel(status), [status])
  const isUnrepairedReturn = useMemo(() => UNREPAIRED_RETURN_STATUSES.has(status), [status])
  const revisedEstimatePath = `/admin/quotes/${quoteId}/revised-estimate`

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

      const refreshResponse = await fetch(`/admin/api/quotes/${quoteId}/order`, { cache: 'no-store' })
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

  const handleIntakeSave = async (event) => {
    event.preventDefault()
    setIntakeSaving(true)
    setIntakeError('')
    setIntakeSuccess('')

    try {
      const response = await fetch(`/admin/api/quotes/${quoteId}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageCondition,
          deviceCondition,
          includedItems,
          imeiOrSerial,
          powerTestResult,
          intakePhotosComplete,
          hiddenDamageFound,
          liquidDamageFound,
          boardDamageFound,
          notes: intakeNotes,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save intake report.')

      setIntake(result.intake)
      setIntakeSuccess('Intake report saved.')
    } catch (err) {
      setIntakeError(err.message || 'Unable to save intake report.')
    } finally {
      setIntakeSaving(false)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if (!messageBody.trim()) return

    setMessageSending(true)
    setMessageError('')

    try {
      const response = await fetch(`/admin/api/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: messageBody,
          senderRole: 'admin',
          internalOnly: messageInternalOnly,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send message.')

      setMessages((current) => [...current, result.message])
      setMessageBody('')
    } catch (err) {
      setMessageError(err.message || 'Unable to send message.')
    } finally {
      setMessageSending(false)
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

            {record.order?.id && (
              <form className='policy-card' onSubmit={handleIntakeSave}>
                <div className='kicker'>Device intake</div>
                <h3>Condition on arrival</h3>
                <p style={{ marginBottom: 18 }}>
                  Record the device state when it arrives. This protects against disputes about
                  pre-existing damage.
                </p>

                <div className='form-grid'>
                  <div className='field'>
                    <label htmlFor='package-condition'>Package condition</label>
                    <input
                      id='package-condition'
                      value={packageCondition}
                      onChange={(e) => setPackageCondition(e.target.value)}
                      placeholder='Good, Damaged, etc.'
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='device-condition'>Device condition</label>
                    <input
                      id='device-condition'
                      value={deviceCondition}
                      onChange={(e) => setDeviceCondition(e.target.value)}
                      placeholder='Good, Cracked screen, etc.'
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='imei-serial'>IMEI / Serial</label>
                    <input
                      id='imei-serial'
                      value={imeiOrSerial}
                      onChange={(e) => setImeiOrSerial(e.target.value)}
                      placeholder='IMEI or serial number'
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='power-test'>Power test result</label>
                    <input
                      id='power-test'
                      value={powerTestResult}
                      onChange={(e) => setPowerTestResult(e.target.value)}
                      placeholder='Powers on, No power, etc.'
                    />
                  </div>
                </div>

                <div className='field' style={{ marginTop: 18 }}>
                  <label htmlFor='included-items'>Included items</label>
                  <input
                    id='included-items'
                    value={includedItems}
                    onChange={(e) => setIncludedItems(e.target.value)}
                    placeholder='Device only, charger included, etc.'
                  />
                </div>

                <div className='form-grid' style={{ marginTop: 18 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={intakePhotosComplete}
                      onChange={(e) => setIntakePhotosComplete(e.target.checked)}
                    />
                    Photos complete
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={hiddenDamageFound}
                      onChange={(e) => setHiddenDamageFound(e.target.checked)}
                    />
                    Hidden damage found
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={liquidDamageFound}
                      onChange={(e) => setLiquidDamageFound(e.target.checked)}
                    />
                    Liquid damage found
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={boardDamageFound}
                      onChange={(e) => setBoardDamageFound(e.target.checked)}
                    />
                    Board damage found
                  </label>
                </div>

                <div className='field' style={{ marginTop: 18 }}>
                  <label htmlFor='intake-notes'>Intake notes</label>
                  <textarea
                    id='intake-notes'
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                    placeholder='Any additional observations about the device on arrival.'
                  />
                </div>

                {intakeError ? <div className='notice'>{intakeError}</div> : null}
                {intakeSuccess ? <div className='notice'>{intakeSuccess}</div> : null}

                <div className='inline-actions' style={{ marginTop: 18 }}>
                  <button type='submit' className='button button-primary' disabled={intakeSaving}>
                    {intakeSaving ? 'Saving…' : intake ? 'Update Intake Report' : 'Save Intake Report'}
                  </button>
                </div>
              </form>
            )}

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

            {record.order?.id && (
              <div className='policy-card'>
                <div className='kicker'>Messages</div>
                <h3>Order communication log</h3>
                <p style={{ marginBottom: 18 }}>
                  Staff notes and customer-facing messages. Mark internal-only to keep a note
                  visible only to staff.
                </p>

                <div className='preview-meta' style={{ marginTop: 0 }}>
                  {messagesLoading ? (
                    <div className='preview-meta-row'>
                      <span>Loading messages…</span>
                      <span>—</span>
                    </div>
                  ) : messages.length ? (
                    messages.map((msg) => (
                      <div key={msg.id} className='preview-meta-row'>
                        <span>
                          <strong>{msg.sender_role}</strong>
                          {msg.internal_only ? ' (internal)' : ''}: {msg.body}
                        </span>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className='preview-meta-row'>
                      <span>No messages yet.</span>
                      <span>—</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} style={{ marginTop: 18 }}>
                  <div className='field'>
                    <label htmlFor='message-body'>New message</label>
                    <textarea
                      id='message-body'
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder='Type a message or internal note…'
                    />
                  </div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={messageInternalOnly}
                      onChange={(e) => setMessageInternalOnly(e.target.checked)}
                    />
                    Internal only (not visible to customer)
                  </label>
                  {messageError ? <div className='notice' style={{ marginTop: 10 }}>{messageError}</div> : null}
                  <div className='inline-actions' style={{ marginTop: 12 }}>
                    <button
                      type='submit'
                      className='button button-primary'
                      disabled={messageSending || !messageBody.trim()}
                    >
                      {messageSending ? 'Sending…' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
