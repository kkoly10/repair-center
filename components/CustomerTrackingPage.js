'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { statusPill } from '../lib/statusPills'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT, useLocale } from '../lib/i18n/TranslationProvider'

const TIMELINE_NODES = [
  { key: 'submitted',     labelKey: 'tracking.stepSubmitted' },
  { key: 'inspection',    labelKey: 'tracking.stepInspecting' },
  { key: 'repairing',     labelKey: 'tracking.stepRepairing' },
  { key: 'ready_to_ship', labelKey: 'tracking.stepReady' },
  { key: 'shipped',       labelKey: 'tracking.stepShipped' },
]

const ORDER_TO_NODE = {
  inspection: 1,
  repairing: 2, awaiting_parts: 2,
  awaiting_balance_payment: 3, ready_to_ship: 3,
  shipped: 4, delivered: 4,
}

// Map status enum keys → tracking.desc* translation keys (agent's namespace)
const STATUS_DESC_KEYS = {
  submitted:                'tracking.descSubmitted',
  under_review:             'tracking.descUnderReview',
  estimate_sent:            'tracking.descEstimateSent',
  approved:                 'tracking.descApproved',
  inspection:               'tracking.descInspection',
  repairing:                'tracking.descRepairing',
  awaiting_parts:           'tracking.descAwaitingParts',
  awaiting_balance_payment: 'tracking.descAwaitingBalancePayment',
  ready_to_ship:            'tracking.descReadyToShip',
  shipped:                  'tracking.descShipped',
  delivered:                'tracking.descDelivered',
  cancelled:                'tracking.descCancelled',
  returned_unrepaired:      'tracking.descReturnedUnrepaired',
  beyond_economical_repair: 'tracking.descBeyondEconomicalRepair',
  no_fault_found:           'tracking.descNoFaultFound',
}

const SENDER_KEYS = {
  admin:    'tracking.senderAdmin',
  tech:     'tracking.senderTech',
  customer: 'tracking.senderCustomer',
  system:   'tracking.senderSystem',
}

function fmtRelTime(iso, t) {
  if (!iso) return t('tracking.timeUnknown')
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 2)   return t('tracking.timeJustNow')
  if (mins < 60)  return t('tracking.timeMinutesAgo', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return hrs === 1 ? t('tracking.timeHourAgo') : t('tracking.timeHoursAgo', { count: hrs })
  const days = Math.floor(hrs / 24)
  return days === 1 ? t('tracking.timeDayAgo') : t('tracking.timeDaysAgo', { count: days })
}

const LOCALE_TO_BCP = { en: 'en-US', fr: 'fr-FR', es: 'es-ES', pt: 'pt-PT' }

function fmtDate(iso, locale) {
  if (!iso) return '—'
  const bcp = LOCALE_TO_BCP[locale] || 'en-US'
  return new Date(iso).toLocaleDateString(bcp, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CustomerTrackingPage({ quoteId, orgSlug, tok, prefillEmail = '' }) {
  const t              = useT()
  const locale         = useLocale()
  const [email,        setEmail]        = useState(prefillEmail)
  const [loading,      setLoading]      = useState(!!prefillEmail)
  const [error,        setError]        = useState('')
  const [record,       setRecord]       = useState(null)
  const [replyBody,    setReplyBody]    = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyError,   setReplyError]   = useState('')
  const [replySuccess, setReplySuccess] = useState('')

  const currentStatus = record?.order?.current_status || record?.quote?.status
  const activeNode    = record ? (ORDER_TO_NODE[record.order?.current_status] ?? 0) : 0
  const lastUpdated   = record?.order?.updated_at || record?.quote?.created_at

  const descriptionText = useMemo(() => {
    const key = STATUS_DESC_KEYS[currentStatus]
    if (!key) return ''
    const v = t(key)
    return v === key ? '' : v
  }, [currentStatus, t])

  const msgCount = useMemo(() => (record?.messages || []).length, [record])

  const didAutoVerify = useRef(false)
  useEffect(() => {
    if (!prefillEmail || didAutoVerify.current) return
    didAutoVerify.current = true
    const tm = setTimeout(() => {
      setLoading(true)
      setError('')
      fetch(`/api/track/${quoteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prefillEmail, ...(orgSlug ? { orgSlug } : {}), ...(tok ? { tok } : {}) }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (!result.error) setRecord(result)
          else setError(result.error || t('tracking.trackingLoadError'))
        })
        .catch(() => setError(t('tracking.trackingLoadError')))
        .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(tm)
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
      if (!res.ok) throw new Error(result.error || t('tracking.trackingLoadError'))
      setRecord(result)
    } catch (err) {
      setRecord(null)
      setError(err.message || t('tracking.trackingLoadError'))
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
      if (!res.ok) throw new Error(result.error || t('tracking.replyErrorDefault'))
      setRecord((prev) => prev ? { ...prev, messages: [...(prev.messages || []), result.message] } : prev)
      setReplyBody('')
      setReplySuccess(t('tracking.replySuccessMsg'))
    } catch (err) {
      setReplyError(err.message || t('tracking.replyErrorDefault'))
    } finally { setReplySending(false) }
  }

  return (
    <main>
      {orgSlug && (
        <header className='shop-header'>
          <LocalizedLink href={`/shop/${orgSlug}`} style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            {t('tracking.backToShop')}
          </LocalizedLink>
          <span className='shop-header-name' style={{ flex: 1, textAlign: 'center' }}>{t('tracking.pageTitleSimple')}</span>
        </header>
      )}

      <div className='site-shell page-stack' style={{ maxWidth: 700, paddingTop: 32, paddingBottom: 48 }}>

        {!record ? (
          <div className='info-card'>
            <div className='kicker'>{t('tracking.kicker')}</div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', marginBottom: 8 }}>{t('tracking.titleAlt')}</h1>
            <p style={{ color: 'var(--muted)', margin: '0 0 24px' }}>{t('tracking.prompt')}</p>
            <form onSubmit={handleVerify}>
              <div className='field' style={{ marginBottom: 16 }}>
                <label htmlFor='track-email'>{t('tracking.emailLabel')}</label>
                <input
                  id='track-email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('tracking.emailPlaceholder')}
                  required
                />
              </div>
              {error && <div className='notice notice-warn' style={{ marginBottom: 16 }}>{error}</div>}
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? t('tracking.loading') : t('tracking.trackButton')}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className='policy-card'>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div>
                  <div className='id-mono' style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6 }}>
                    {record.canonicalOrderNumber || record.canonicalQuoteId}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ') || t('tracking.unknownDevice')}
                  </div>
                  {record.quote.repair_type_key && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 3 }}>
                      {record.quote.repair_type_key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </div>
                  )}
                </div>
                <span className={statusPill(currentStatus, t).cls}>{statusPill(currentStatus, t).label}</span>
              </div>

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
                        <div className={`timeline-label${nodeState === 'active' ? ' active' : ''}`}>{t(node.labelKey)}</div>
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
                {t('tracking.updatedRel', { time: fmtRelTime(lastUpdated, t) })}
              </div>
            </div>

            {record.order?.current_status === 'awaiting_final_approval' && (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 6 }}>{t('tracking.actionRequiredTitle')}</strong>
                {t('tracking.actionRequiredText')}
                <div className='inline-actions' style={{ marginBottom: 0, marginTop: 12 }}>
                  <LocalizedLink href={record.reviewPath} className='button button-primary'>{t('tracking.reviewApproveBtn')}</LocalizedLink>
                </div>
              </div>
            )}
            {record.depositRequired && !record.depositPaid && (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 6 }}>{t('tracking.depositRequiredTitle')}</strong>
                {t('tracking.depositRequiredText')}
                <div className='inline-actions' style={{ marginBottom: 0, marginTop: 12 }}>
                  <LocalizedLink href={record.paymentPath} className='button button-primary'>{t('tracking.payDepositBtn')}</LocalizedLink>
                </div>
              </div>
            )}
            {record.order?.current_status === 'awaiting_balance_payment' && (
              <div className='notice notice-warn'>
                <strong style={{ display: 'block', marginBottom: 6 }}>{t('tracking.finalPaymentTitle')}</strong>
                {t('tracking.finalPaymentText')}
                <div className='inline-actions' style={{ marginBottom: 0, marginTop: 12 }}>
                  <LocalizedLink href={record.balancePaymentPath} className='button button-primary'>{t('tracking.payFinalBalanceBtn')}</LocalizedLink>
                </div>
              </div>
            )}

            <div className='policy-card'>
              <div className='kicker'>{t('tracking.orderSummary')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginTop: 14 }}>
                {[
                  { label: t('tracking.deviceLabelSummary'),    value: [record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ') || '—' },
                  { label: t('tracking.quoteIdLabel'),          value: <span className='id-mono'>{record.canonicalQuoteId || '—'}</span> },
                  { label: t('tracking.orderNumberLabel'),      value: record.canonicalOrderNumber ? <span className='id-mono'>{record.canonicalOrderNumber}</span> : '—' },
                  { label: t('tracking.estimateLabel'),         value: record.estimate?.total_amount != null ? `$${Number(record.estimate.total_amount).toFixed(2)}` : '—' },
                  { label: t('tracking.submittedLabelSummary'), value: fmtDate(record.quote.created_at, locale) },
                  ...(record.depositRequired ? [{
                    label: t('tracking.depositLabelSummary'),
                    value: record.depositPaid
                      ? <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('tracking.paid')}</span>
                      : <span style={{ color: '#b45309', fontWeight: 600 }}>{t('tracking.unpaid')}</span>,
                  }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {(record.shipments || []).length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>{t('tracking.shipmentsHeader')}</div>
                  {record.shipments.map((s) => (
                    <div key={s.id} style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 4 }}>
                      {s.shipment_type} · {s.carrier || t('tracking.carrierPending')}
                      {s.tracking_number ? ` · ${s.tracking_number}` : ''}
                      {' — '}<span style={{ color: 'var(--text)' }}>{s.status || t('tracking.statusPendingDefault')}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className='inline-actions' style={{ marginTop: 20 }}>
                {record.reviewPath && (
                  <LocalizedLink href={record.reviewPath} className='button button-secondary' style={{ fontSize: '0.82rem' }}>{t('tracking.viewEstimateBtn')}</LocalizedLink>
                )}
                {record.mailInPath && (
                  <LocalizedLink href={record.mailInPath} className='button button-secondary' style={{ fontSize: '0.82rem' }}>{t('tracking.mailInBtn')}</LocalizedLink>
                )}
              </div>
            </div>

            <details className='policy-card tracking-details'>
              <summary>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {msgCount === 1 ? t('tracking.messagesOne') : (msgCount > 1 ? t('tracking.messagesMany', { count: msgCount }) : t('tracking.messagesLabel'))}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>{t('tracking.messagesWithTeam')}</span>
              </summary>

              <div style={{ marginTop: 20 }}>
                <div className='message-thread'>
                  {(record.messages || []).length > 0 ? (
                    record.messages.map((m) => (
                      <div key={m.id} className={`message-bubble ${m.sender_role === 'customer' ? 'message-bubble-customer' : 'message-bubble-staff'}`}>
                        <strong>{SENDER_KEYS[m.sender_role] ? t(SENDER_KEYS[m.sender_role]) : t('tracking.senderDefault')}</strong>
                        <span>{m.body}</span>
                        <small>{new Date(m.created_at).toLocaleString(LOCALE_TO_BCP[locale] || 'en-US')}</small>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>{t('tracking.noMessages')}</p>
                  )}
                </div>

                {record.order && (
                  <form onSubmit={handleReply} style={{ marginTop: 20 }}>
                    <div className='field' style={{ marginBottom: 12 }}>
                      <label htmlFor='customer-reply'>{t('tracking.sendAMessageLabel')}</label>
                      <textarea
                        id='customer-reply'
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder={t('tracking.replyPlaceholder')}
                        style={{ minHeight: 80 }}
                      />
                    </div>
                    {replyError   && <div className='notice notice-warn' style={{ marginBottom: 10 }}>{replyError}</div>}
                    {replySuccess && <div className='notice notice-success' style={{ marginBottom: 10 }}>{replySuccess}</div>}
                    <button type='submit' className='button button-primary' disabled={replySending || !replyBody.trim()}>
                      {replySending ? t('tracking.sendingBtn') : t('tracking.sendBtnLabel')}
                    </button>
                  </form>
                )}
              </div>
            </details>

            {(record.statusHistory || []).length > 0 && (
              <details className='policy-card tracking-details'>
                <summary>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('tracking.viewHistory')}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>
                    {record.statusHistory.length === 1 ? t('tracking.eventOne') : t('tracking.eventMany', { count: record.statusHistory.length })}
                  </span>
                </summary>
                <div style={{ marginTop: 16 }}>
                  {record.statusHistory.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text)' }}>
                        {statusPill(item.new_status, t).label}
                        {item.note ? ` — ${item.note}` : ''}
                      </span>
                      <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(item.created_at).toLocaleString(LOCALE_TO_BCP[locale] || 'en-US')}</span>
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
