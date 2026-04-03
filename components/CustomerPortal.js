'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import QuoteStatusBadge from './QuoteStatusBadge'

const ACTIVE_STATUSES = new Set([
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
])

export default function CustomerPortal() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('request')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [previewCode, setPreviewCode] = useState('')
  const [data, setData] = useState(null)

  const totalSpent = useMemo(() => {
    return (
      data?.payments
        ?.filter((payment) => payment.status === 'succeeded' || payment.status === 'paid')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0
    )
  }, [data])

  const activeRepairs = useMemo(() => {
    return data ? data.repairOrders.filter((order) => ACTIVE_STATUSES.has(order.current_status)).length : 0
  }, [data])

  async function handleRequestCode(event) {
    event.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')
    setMessage('')
    setPreviewCode('')
    setData(null)

    try {
      const response = await fetch('/api/customer-portal/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setError(result.error || 'Unable to send a verification code right now.')
        return
      }

      setMessage(
        result.message ||
          'If a matching repair record exists, we have sent a verification code to that email address.'
      )
      setPreviewCode(result.previewCode || '')
      setStep('verify')
    } catch {
      setError('Unable to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault()
    if (!email.trim() || !code.trim()) return

    setVerifying(true)
    setError('')
    setMessage('')

    try {
      const verifyResponse = await fetch('/api/customer-portal/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyResult.ok) {
        setError(verifyResult.error || 'That verification code is not valid.')
        return
      }

      await loadPortalData(email.trim().toLowerCase())
      setStep('ready')
    } catch {
      setError('Unable to verify that code right now.')
    } finally {
      setVerifying(false)
    }
  }

  async function loadPortalData(verifiedEmail) {
    const response = await fetch('/api/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifiedEmail }),
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Unable to load your repair history.')
    }

    setData(result)
    setCode('')
    setPreviewCode('')
    setMessage('')
  }

  async function handleSignOut() {
    try {
      await fetch('/api/customer-portal/logout', {
        method: 'POST',
      })
    } catch {
      // ignore
    }

    setData(null)
    setCode('')
    setError('')
    setMessage('')
    setPreviewCode('')
    setStep('request')
  }

  function handleStartOver() {
    setCode('')
    setError('')
    setMessage('')
    setPreviewCode('')
    setStep('request')
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatRepairType(value) {
    return String(value || '')
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  function formatPrice(quote) {
    if (quote.preliminary_price_fixed != null) {
      return `$${Number(quote.preliminary_price_fixed).toFixed(2)}`
    }

    if (quote.preliminary_price_min != null && quote.preliminary_price_max != null) {
      return `$${Number(quote.preliminary_price_min).toFixed(2)} – $${Number(
        quote.preliminary_price_max
      ).toFixed(2)}`
    }

    if (quote.preliminary_price_min != null) {
      return `From $${Number(quote.preliminary_price_min).toFixed(2)}`
    }

    return null
  }

  const ordersByQuote = {}
  if (data) {
    for (const order of data.repairOrders || []) {
      ordersByQuote[order.quote_request_id] = order
    }
  }

  return (
    <div className='site-shell'>
      <section className='page-hero'>
        <p className='kicker'>Customer Portal</p>
        <h1>My Repairs</h1>
        <p className='muted'>Securely look up your repair history and active repairs.</p>
      </section>

      <div className='page-stack'>
        {step === 'request' && !data ? (
          <div className='info-card'>
            <form onSubmit={handleRequestCode}>
              <label
                htmlFor='portal-email'
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
              >
                Email address
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  id='portal-email'
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  style={{
                    flex: '1 1 260px',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                  }}
                />
                <button type='submit' className='button button-primary' disabled={loading}>
                  {loading ? 'Sending code…' : 'Send verification code'}
                </button>
              </div>
            </form>

            {error ? (
              <div className='notice notice-warn' style={{ marginTop: '1rem' }}>
                {error}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 'verify' && !data ? (
          <div className='info-card'>
            <p style={{ marginTop: 0 }}>
              We sent a verification code to <strong>{email}</strong>.
            </p>
            <p className='muted' style={{ marginTop: '0.25rem' }}>
              Enter the 6-digit code to continue.
            </p>

            <form onSubmit={handleVerifyCode} style={{ marginTop: '1rem' }}>
              <label
                htmlFor='portal-code'
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
              >
                Verification code
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  id='portal-code'
                  type='text'
                  inputMode='numeric'
                  autoComplete='one-time-code'
                  placeholder='123456'
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                  style={{
                    flex: '1 1 180px',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    letterSpacing: '0.2em',
                  }}
                />
                <button type='submit' className='button button-primary' disabled={verifying}>
                  {verifying ? 'Verifying…' : 'Verify and open portal'}
                </button>
                <button type='button' className='button button-secondary' onClick={handleStartOver}>
                  Start over
                </button>
              </div>
            </form>

            {message ? (
              <div className='notice notice-success' style={{ marginTop: '1rem' }}>
                {message}
              </div>
            ) : null}

            {previewCode ? (
              <div className='notice' style={{ marginTop: '1rem' }}>
                Development preview code: <strong>{previewCode}</strong>
              </div>
            ) : null}

            {error ? (
              <div className='notice notice-warn' style={{ marginTop: '1rem' }}>
                {error}
              </div>
            ) : null}

            <div className='inline-actions' style={{ marginTop: '1rem' }}>
              <button type='button' className='button button-ghost' onClick={handleRequestCode}>
                Resend code
              </button>
            </div>
          </div>
        ) : null}

        {data ? (
          <>
            <div className='info-card'>
              <p style={{ margin: 0 }}>
                Welcome back, <strong>{data.customer.name}</strong>
              </p>
              <p className='muted' style={{ margin: '0.25rem 0 0' }}>
                {data.customer.email}
                {data.customer.phone ? ` · ${data.customer.phone}` : ''}
              </p>
              <div className='inline-actions' style={{ marginTop: '0.75rem' }}>
                <button className='button button-secondary' onClick={handleSignOut}>
                  Sign out
                </button>
                <button
                  className='button button-ghost'
                  onClick={() => {
                    setData(null)
                    setCode('')
                    setError('')
                    setMessage('')
                    setPreviewCode('')
                    setStep('request')
                  }}
                >
                  Look up a different email
                </button>
              </div>
            </div>

            <div className='grid-4'>
              <div className='feature-card'>
                <p className='kicker'>Total Repairs</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  {data.quotes.length}
                </p>
              </div>
              <div className='feature-card'>
                <p className='kicker'>Active Repairs</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  {activeRepairs}
                </p>
              </div>
              <div className='feature-card'>
                <p className='kicker'>Total Spent</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
            </div>

            <section>
              <h2>Repair History</h2>
              {data.quotes.length === 0 ? <p className='muted'>No repair requests found.</p> : null}

              {data.quotes.map((quote) => {
                const order = ordersByQuote[quote.id]
                const price = formatPrice(quote)

                return (
                  <div className='quote-card' key={quote.id}>
                    <div className='quote-top'>
                      <span className='quote-id'>{quote.quote_id}</span>
                      <QuoteStatusBadge status={order?.current_status || quote.status} />
                    </div>

                    <div className='preview-meta'>
                      <div className='preview-meta-row'>
                        <span>
                          {[quote.brand_name, quote.model_name].filter(Boolean).join(' ')} —{' '}
                          {formatRepairType(quote.repair_type_key)}
                        </span>
                      </div>
                      <div className='preview-meta-row'>
                        <span className='muted'>Submitted {formatDate(quote.created_at)}</span>
                        {price ? <span style={{ fontWeight: 600 }}>{price}</span> : null}
                      </div>
                    </div>

                    <div className='inline-actions'>
                      <Link href={`/track/${quote.quote_id}`} className='button button-primary'>
                        Track Repair
                      </Link>
                    </div>
                  </div>
                )
              })}
            </section>

            {data.payments.length > 0 ? (
              <section>
                <h2>Payment History</h2>
                {data.payments.map((payment) => (
                  <div className='preview-card' key={payment.id}>
                    <div className='preview-meta'>
                      <div className='preview-meta-row'>
                        <span style={{ fontWeight: 600 }}>
                          ${Number(payment.amount || 0).toFixed(2)}
                        </span>
                        <QuoteStatusBadge status={payment.status} />
                      </div>
                      <div className='preview-meta-row'>
                        <span className='muted'>
                          {formatRepairType(payment.payment_kind || payment.payment_type)}
                        </span>
                        <span className='muted'>{formatDate(payment.created_at || payment.paid_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
