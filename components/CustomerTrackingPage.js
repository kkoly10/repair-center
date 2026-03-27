'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const STATUS_LABELS = {
  awaiting_mail_in: 'Awaiting Mail-In',
  in_transit_to_shop: 'In Transit to Shop',
  received: 'Received',
  inspection: 'Inspection',
  awaiting_final_approval: 'Awaiting Final Approval',
  approved: 'Approved',
  waiting_parts: 'Waiting for Parts',
  repairing: 'Repairing',
  testing: 'Testing',
  awaiting_balance_payment: 'Awaiting Balance Payment',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  declined: 'Declined',
  returned_unrepaired: 'Returned Unrepaired',
  beyond_economical_repair: 'Beyond Economical Repair',
  no_fault_found: 'No Fault Found',
}

function formatSender(senderRole) {
  if (senderRole === 'admin') return 'Repair Center'
  if (senderRole === 'tech') return 'Technician'
  if (senderRole === 'customer') return 'You'
  return 'System'
}

export default function CustomerTrackingPage({ quoteId }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [replySuccess, setReplySuccess] = useState('')

  const currentStatusLabel = useMemo(() => {
    if (!record?.order?.current_status) return 'No repair order yet'
    return STATUS_LABELS[record.order.current_status] || record.order.current_status
  }, [record])

  const handleVerify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setReplyError('')
    setReplySuccess('')

    try {
      const response = await fetch(`/api/track/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load tracking.')

      setRecord(result)
    } catch (trackingError) {
      setRecord(null)
      setError(trackingError.message || 'Unable to load tracking.')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (event) => {
    event.preventDefault()
    if (!replyBody.trim()) return

    setReplySending(true)
    setReplyError('')
    setReplySuccess('')

    try {
      const response = await fetch(`/api/track/${quoteId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, body: replyBody }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send your message.')

      setRecord((current) =>
        current
          ? {
              ...current,
              messages: [...(current.messages || []), result.message],
            }
          : current
      )
      setReplyBody('')
      setReplySuccess('Your message has been sent to the repair team.')
    } catch (err) {
      setReplyError(err.message || 'Unable to send your message.')
    } finally {
      setReplySending(false)
    }
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Repair tracking</div>
          <h1>Track your repair from estimate approval to return delivery</h1>
          <p>
            Enter the email used for your quote to securely view repair progress, shipment updates,
            and messages from the repair team.
          </p>
        </div>

        <div className='grid-2'>
          <form className='policy-card' onSubmit={handleVerify}>
            <div className='kicker'>Verify request</div>
            <h3>Enter your email</h3>
            <p className='field-note' style={{ marginBottom: 18 }}>
              You can open tracking using either your <strong>Quote ID (RCQ-...)</strong> or your{' '}
              <strong>Order Number (RCO-...)</strong>.
            </p>
            <div className='field' style={{ marginTop: 18 }}>
              <label htmlFor='track-email'>Email address</label>
              <input
                id='track-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='name@example.com'
                required
              />
            </div>

            {error ? (
              <div className='notice notice-warn' style={{ marginTop: 18 }}>
                {error}
              </div>
            ) : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? 'Loading…' : 'Track Repair'}
              </button>
            </div>
          </form>

          <div className='policy-card'>
            <div className='kicker'>What you can see</div>
            <h3>Tracking details</h3>
            <div className='preview-meta' style={{ marginTop: 18 }}>
              <div className='preview-meta-row'>
                <span>1</span>
                <span>Quote and estimate status</span>
              </div>
              <div className='preview-meta-row'>
                <span>2</span>
                <span>Repair order milestones</span>
              </div>
              <div className='preview-meta-row'>
                <span>3</span>
                <span>Shipment and return tracking</span>
              </div>
              <div className='preview-meta-row'>
                <span>4</span>
                <span>Messages from the repair team</span>
              </div>
            </div>
          </div>
        </div>

        {record ? (
          <div className='page-stack'>
            {record.order?.current_status === 'awaiting_final_approval' ? (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>
                  Action required
                </strong>
                A revised estimate needs your approval before the repair can continue.
                <div className='inline-actions' style={{ marginBottom: 0 }}>
                  <Link href={record.reviewPath} className='button button-primary'>
                    Review &amp; Approve Estimate
                  </Link>
                </div>
              </div>
            ) : null}

            <div className='quote-card'>
              <div className='quote-top'>
                <div>
                  <div className='quote-id'>{record.quote.quote_id}</div>
                  <h2 className='quote-title'>
                    {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')}
                  </h2>
                  <p className='muted'>{record.quote.repair_type_key || 'Repair type not set'}</p>
                </div>
                <span className='price-chip'>{currentStatusLabel}</span>
              </div>

              <div className='identity-band'>
                <div className='identity-band-grid'>
                  <div className='identity-band-item'>
                    <strong>Quote ID</strong>
                    <span>{record.canonicalQuoteId || record.quote.quote_id}</span>
                  </div>
                  <div className='identity-band-item'>
                    <strong>Order number</strong>
                    <span>
                      {record.canonicalOrderNumber || record.order?.order_number || 'Not created yet'}
                    </span>
                  </div>
                  <div className='identity-band-item'>
                    <strong>Tracking opened with</strong>
                    <span>{record.identifier}</span>
                  </div>
                </div>
              </div>

              <div className='quote-summary'>
                <div className='quote-summary-card'>
                  <strong>Estimate total</strong>
                  <span>
                    {record.estimate?.total_amount != null
                      ? `$${Number(record.estimate.total_amount).toFixed(2)}`
                      : '—'}
                  </span>
                </div>
                <div className='quote-summary-card'>
                  <strong>Current stage</strong>
                  <span>{currentStatusLabel}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>Accepted lookup IDs</strong>
                  <span>
                    {record.canonicalQuoteId}
                    {record.canonicalOrderNumber ? ` / ${record.canonicalOrderNumber}` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className='grid-2'>
              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>Status history</div>
                  <h3>Repair timeline</h3>
                  <div className='preview-meta' style={{ marginTop: 18 }}>
                    {(record.statusHistory || []).length ? (
                      record.statusHistory.map((item) => (
                        <div key={item.id} className='preview-meta-row'>
                          <span>
                            {STATUS_LABELS[item.new_status] || item.new_status}
                            {item.note ? ` · ${item.note}` : ''}
                          </span>
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className='preview-meta-row'>
                        <span>No customer-visible status history yet.</span>
                        <span>—</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>Helpful links</div>
                  <h3>Next pages</h3>
                  <div className='inline-actions'>
                    <Link href={record.reviewPath} className='button button-secondary'>
                      Review Estimate
                    </Link>
                    {record.mailInPath ? (
                      <Link href={record.mailInPath} className='button button-secondary'>
                        Mail-In Instructions
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>Messages</div>
                  <h3>Repair team updates</h3>
                  <div className='message-thread'>
                    {(record.messages || []).length ? (
                      record.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`message-bubble ${
                            message.sender_role === 'customer'
                              ? 'message-bubble-customer'
                              : 'message-bubble-staff'
                          }`}
                        >
                          <strong>{formatSender(message.sender_role)}</strong>
                          <span>{message.body}</span>
                          <small>{new Date(message.created_at).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <div className='preview-meta-row'>
                        <span>No messages yet.</span>
                        <span>—</span>
                      </div>
                    )}
                  </div>
                </div>

                {record.order ? (
                  <form className='policy-card' onSubmit={handleReply}>
                    <div className='kicker'>Reply</div>
                    <h3>Send a message to the repair team</h3>
                    <div className='field' style={{ marginTop: 18 }}>
                      <label htmlFor='customer-reply'>Message</label>
                      <textarea
                        id='customer-reply'
                        value={replyBody}
                        onChange={(event) => setReplyBody(event.target.value)}
                        placeholder='Ask a question or send a note about your repair.'
                      />
                    </div>

                    {replyError ? (
                      <div className='notice notice-warn' style={{ marginTop: 14 }}>
                        {replyError}
                      </div>
                    ) : null}
                    {replySuccess ? (
                      <div className='notice notice-success' style={{ marginTop: 14 }}>
                        {replySuccess}
                      </div>
                    ) : null}

                    <div className='inline-actions'>
                      <button
                        type='submit'
                        className='button button-primary'
                        disabled={replySending || !replyBody.trim()}
                      >
                        {replySending ? 'Sending…' : 'Send Message'}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>

              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>Shipment updates</div>
                  <h3>Tracking numbers and delivery status</h3>
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
                        <span>No shipment updates yet.</span>
                        <span>—</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>Repair summary</div>
                  <h3>Current order details</h3>
                  <div className='preview-meta' style={{ marginTop: 18 }}>
                    <div className='preview-meta-row'>
                      <span>Quote status</span>
                      <span>{record.quote.status}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Estimate status</span>
                      <span>{record.estimate?.status || '—'}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Turnaround</span>
                      <span>{record.estimate?.turnaround_note || 'After intake review'}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Warranty</span>
                      <span>
                        {record.estimate?.warranty_days
                          ? `${record.estimate.warranty_days} days`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}