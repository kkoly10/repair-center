'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { statusPill } from '../lib/statusPills'

const TIMELINE_NODES = [
  { key: 'submitted',     label: 'Submitted' },
  { key: 'inspection',    label: 'Inspecting' },
  { key: 'repairing',     label: 'Repairing' },
  { key: 'ready_to_ship', label: 'Ready' },
  { key: 'shipped',       label: 'Shipped' },
]

const ORDER_TO_NODE = {
  inspection: 1,
  repairing: 2, awaiting_parts: 2,
  awaiting_balance_payment: 3, ready_to_ship: 3,
  shipped: 4, delivered: 4,
}

const STATUS_DESCRIPTIONS = {
  submitted:                'Your request has been received. We\'ll review it shortly.',
  under_review:             'Our team is reviewing your device details and photos.',
  estimate_sent:            'We\'ve sent you an estimate by email. Please review it to proceed.',
  approved:                 'Estimate approved — awaiting your device.',
  inspection:               'Your device has arrived and we\'re assessing it.',
  repairing:                'Repair is in progress. We\'ll keep you updated.',
  awaiting_parts:           'Waiting on parts to arrive before we continue.',
  awaiting_balance_payment: 'Repair is complete! Please pay the remaining balance to ship.',
  ready_to_ship:            'Your device is repaired and ready to be shipped back to you.',
  shipped:                  'Your device is on its way back to you.',
  delivered:                'Your device has been delivered. Enjoy!',
  cancelled:                'This repair has been cancelled.',
  returned_unrepaired:      'Your device was returned without repair.',
  beyond_economical_repair: 'Unfortunately the repair cost would exceed the device value.',
  no_fault_found:           'Our inspection found no fault with the device.',
}

const SENDER_NAMES = { admin: 'Repair Team', tech: 'Technician', customer: 'You', system: 'System' }

function fmtRelTime(iso) {
  if (!iso) return 'unknown'
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins} minutes ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CustomerTrackingPage({ quoteId, orgSlug, tok, prefillEmail = '' }) {
  const [email,        setEmail]        = useState(prefillEmail)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [record,       setRecord]       = useState(null)
  const [replyBody,    setReplyBody]    = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyError,   setReplyError]   = useState('')
  const [replySuccess, setReplySuccess] = useState('')

  const currentStatus = record?.order?.current_status || record?.quote?.status
  const activeNode    = record ? (ORDER_TO_NODE[record.order?.current_status] ?? 0) : 0
  const lastUpdated   = record?.order?.updated_at || record?.quote?.created_at

  const descriptionText = useMemo(() => STATUS_DESCRIPTIONS[currentStatus] || '', [currentStatus])
  const msgCount        = useMemo(() => (record?.messages || []).length, [record])

  // Auto-verify when a prefill email is provided (customer is logged in)
  const didAutoVerify = useRef(false)
  useEffect(() => {
    if (!prefillEmail || didAutoVerify.current) return
    didAutoVerify.current = true
    const t = setTimeout(() => {
      setLoading(true)
      setError('')
      fetch(`/api/track/${quoteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prefillEmail, ...(orgSlug ? { orgSlug } : {}), ...(tok ? { tok } : {}) }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.ok !== false && !result.error) setRecord(result)
          else setError(result.error || 'Unable to load tracking.')
        })
        .catch(() => setError('Unable to load tracking.'))
        .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true); setError('')
    setReplyError(''); setReplySuccess('')
    try {
      const res    = await fetch(`/api/track/${quoteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...(orgSlug ? { orgSlug } : {}), ...(tok ? { tok } : {}) }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Unable to load tracking.')
      setRecord(result)
    } catch (err) {
      setRecord(null)
      setError(err.message || 'Unable to load tracking.')
    } finally { setLoading(false) }
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!replyBody.trim()) return
    setReplySending(true); setReplyError(''); setReplySuccess('')
    try {
      const res    = await fetch(`/api/track/${quoteId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, body: replyBody, ...(orgSlug ? { orgSlug } : {}) }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Unable to send your message.')
      setRecord((prev) => prev ? { ...prev, messages: [...(prev.messages || []), result.message] } : prev)
      setReplyBody('')
      setReplySuccess('Your message has been sent.')
    } catch (err) {
      setReplyError(err.message || 'Unable to send your message.')
    } finally { setReplySending(false) }
  }

  return (
    <main>
      {/* Shop header */}
      {orgSlug && (
        <header className='shop-header'>
          <Link href={`/shop/${orgSlug}`} style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to shop
          </Link>
          <span className='shop-header-name' style={{ flex: 1, textAlign: 'center' }}>Track Your Repair</span>
        </header>
      )}

      <div className='site-shell page-stack' style={{ maxWidth: 700, paddingTop: 32, paddingBottom: 48 }}>

        {!record ? (
          /* ─── Verify form ─────────────────────────────────── */
          <div className='info-card'>
            <div className='kicker'>Repair tracking</div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', marginBottom: 8 }}>Track your repair</h1>
            <p style={{ color: 'var(--muted)', margin: '0 0 24px' }}>
              Enter the email you used when submitting your request. You can use your Quote ID{' '}
              (RCQ-…) or Order Number (RCO-…).
            </p>
            <form onSubmit={handleVerify}>
              <div className='field' style={{ marginBottom: 16 }}>
                <label htmlFor='track-email'>Email address</label>
                <input
                  id='track-email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='name@example.com'
                  required
                />
              </div>
              {error && <div className='notice notice-warn' style={{ marginBottom: 16 }}>{error}</div>}
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? 'Loading…' : 'Track Repair'}
              </button>
            </form>
          </div>
        ) : (
          /* ─── Record found ────────────────────────────────── */
          <>
            {/* 1 — Status card + timeline */}
            <div className='policy-card'>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div>
                  <div className='id-mono' style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6 }}>
                    {record.canonicalOrderNumber || record.canonicalQuoteId}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ') || 'Your device'}
                  </div>
                  {record.quote.repair_type_key && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 3 }}>
                      {record.quote.repair_type_key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </div>
                  )}
                </div>
                <span className={statusPill(currentStatus).cls}>{statusPill(currentStatus).label}</span>
              </div>

              {/* Horizontal timeline */}
              <div className='repair-timeline'>
                {TIMELINE_NODES.map((node, i) => {
                  const nodeState = i < activeNode ? 'done' : i === activeNode ? 'active' : 'upcoming'
                  const isLast    = i === TIMELINE_NODES.length - 1
                  return (
                    <div key={node.key} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? '0 0 auto' : 1 }}>
                      <div className='timeline-step'>
                        <div className={`timeline-dot${nodeState === 'done' ? ' done' : nodeState === 'active' ? ' active' : ''}`}>
                          {nodeState === 'done' ? '✓' : null}
                        </div>
                        <div className={`timeline-label${nodeState === 'active' ? ' active' : ''}`}>{node.label}</div>
                      </div>
                      {!isLast && <div className={`timeline-line${nodeState === 'done' ? ' done' : ''}`} />}
                    </div>
                  )
                })}
              </div>

              {descriptionText && (
                <p style={{ margin: '16px 0 0', fontSize: '0.875rem', color: 'var(--muted)' }}>{descriptionText}</p>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 8, opacity: 0.7 }}>
                Updated {fmtRelTime(lastUpdated)}
              </div>
            </div>

            {/* 2 — Action banners */}
            {record.order?.current_status === 'awaiting_final_approval' && (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 6 }}>Action required</strong>
                A revised estimate needs your approval before the repair can continue.
                <div className='inline-actions' style={{ marginBottom: 0, marginTop: 12 }}>
                  <Link href={record.reviewPath} className='button button-primary'>Review &amp; Approve</Link>
                </div>
              </div>
            )}
            {record.depositRequired && !record.depositPaid && (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 6 }}>Deposit required</strong>
                An inspection deposit is required before we can begin.
                <div className='inline-actions' style={{ marginBottom: 0, marginTop: 12 }}>
                  <Link href={record.paymentPath} className='button button-primary'>Pay Inspection Deposit</Link>
                </div>
              </div>
            )}
            {record.order?.current_status === 'awaiting_balance_payment' && (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 6 }}>Final payment required</strong>
                Repair is complete. Pay the remaining balance so we can ship your device back.
                <div className='inline-actions' style={{ marginBottom: 0, marginTop: 12 }}>
                  <Link href={record.balancePaymentPath} className='button button-primary'>Pay Final Balance</Link>
                </div>
              </div>
            )}

            {/* 3 — Order summary (always visible) */}
            <div className='policy-card'>
              <div className='kicker'>Order summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginTop: 14 }}>
                {[
                  { label: 'Device',     value: [record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ') || '—' },
                  { label: 'Quote ID',   value: <span className='id-mono'>{record.canonicalQuoteId || '—'}</span> },
                  { label: 'Order #',    value: record.canonicalOrderNumber ? <span className='id-mono'>{record.canonicalOrderNumber}</span> : '—' },
                  { label: 'Estimate',   value: record.estimate?.total_amount != null ? `$${Number(record.estimate.total_amount).toFixed(2)}` : '—' },
                  { label: 'Submitted',  value: fmtDate(record.quote.created_at) },
                  ...(record.depositRequired ? [{
                    label: 'Deposit',
                    value: record.depositPaid
                      ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Paid ✓</span>
                      : <span style={{ color: '#b45309', fontWeight: 600 }}>Unpaid</span>,
                  }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Shipments */}
              {(record.shipments || []).length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>Shipments</div>
                  {record.shipments.map((s) => (
                    <div key={s.id} style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 4 }}>
                      {s.shipment_type} · {s.carrier || 'Carrier pending'}
                      {s.tracking_number ? ` · ${s.tracking_number}` : ''}
                      {' — '}<span style={{ color: 'var(--text)' }}>{s.status || 'Pending'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick links */}
              <div className='inline-actions' style={{ marginTop: 20 }}>
                {record.reviewPath && (
                  <Link href={record.reviewPath} className='button button-secondary' style={{ fontSize: '0.82rem' }}>View Estimate</Link>
                )}
                {record.mailInPath && (
                  <Link href={record.mailInPath} className='button button-secondary' style={{ fontSize: '0.82rem' }}>Mail-In Instructions</Link>
                )}
              </div>
            </div>

            {/* 4 — Messages (collapsed) */}
            <details className='policy-card tracking-details'>
              <summary>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {msgCount > 0 ? `${msgCount} message${msgCount !== 1 ? 's' : ''}` : 'Messages'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>with the repair team</span>
              </summary>

              <div style={{ marginTop: 20 }}>
                <div className='message-thread'>
                  {(record.messages || []).length > 0 ? (
                    record.messages.map((m) => (
                      <div key={m.id} className={`message-bubble ${m.sender_role === 'customer' ? 'message-bubble-customer' : 'message-bubble-staff'}`}>
                        <strong>{SENDER_NAMES[m.sender_role] || 'Team'}</strong>
                        <span>{m.body}</span>
                        <small>{new Date(m.created_at).toLocaleString()}</small>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>No messages yet.</p>
                  )}
                </div>

                {record.order && (
                  <form onSubmit={handleReply} style={{ marginTop: 20 }}>
                    <div className='field' style={{ marginBottom: 12 }}>
                      <label htmlFor='customer-reply'>Send a message</label>
                      <textarea
                        id='customer-reply'
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder='Ask a question or send a note about your repair.'
                        style={{ minHeight: 80 }}
                      />
                    </div>
                    {replyError   && <div className='notice notice-warn' style={{ marginBottom: 10 }}>{replyError}</div>}
                    {replySuccess && <div className='notice notice-success' style={{ marginBottom: 10 }}>{replySuccess}</div>}
                    <button type='submit' className='button button-primary' disabled={replySending || !replyBody.trim()}>
                      {replySending ? 'Sending…' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </details>

            {/* 5 — Activity history (collapsed) */}
            {(record.statusHistory || []).length > 0 && (
              <details className='policy-card tracking-details'>
                <summary>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>View full history</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>
                    {record.statusHistory.length} event{record.statusHistory.length !== 1 ? 's' : ''}
                  </span>
                </summary>
                <div style={{ marginTop: 16 }}>
                  {record.statusHistory.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text)' }}>
                        {statusPill(item.new_status).label}
                        {item.note ? ` — ${item.note}` : ''}
                      </span>
                      <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </main>
  )
}
