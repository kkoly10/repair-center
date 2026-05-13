'use client'

import { useEffect, useState } from 'react'

const STATUS_COLORS = {
  active: 'var(--success)',
  trialing: 'var(--info, #3b82f6)',
  past_due: 'var(--warn, #f59e0b)',
  suspended: 'var(--danger)',
  cancelled: 'var(--muted)',
}

function StatusBadge({ status }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 9999,
      background: STATUS_COLORS[status] || 'var(--muted)',
      color: '#fff',
      fontSize: '0.8rem',
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {status?.replace('_', ' ')}
    </span>
  )
}

export default function AdminBillingPage() {
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetch('/admin/api/billing')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setBilling(json.billing)
        else setError(json.error || 'Failed to load billing.')
      })
      .catch(() => setError('Failed to load billing.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCheckout() {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch('/admin/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setActionError(json.error || 'Unable to start checkout.')
      }
    } catch {
      setActionError('Unable to start checkout.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePortal() {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch('/admin/api/billing/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setActionError(json.error || 'Unable to open billing portal.')
      }
    } catch {
      setActionError('Unable to open billing portal.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className='site-shell' style={{ paddingTop: 40 }}><p>Loading billing…</p></div>
  if (error) return <div className='site-shell' style={{ paddingTop: 40 }}><p className='notice-error'>{error}</p></div>

  const isTrial = billing.status === 'trialing'
  const isPastDue = billing.status === 'past_due'
  const isActive = billing.status === 'active'
  const hasSub = billing.hasActiveSubscription

  return (
    <div className='site-shell' style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 700 }}>
      <h1 style={{ marginBottom: 24 }}>Billing &amp; Subscription</h1>

      {/* Status card */}
      <div className='policy-card' style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Current Plan</h2>
          <StatusBadge status={billing.status} />
        </div>

        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 24px', margin: 0 }}>
          <dt style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Plan</dt>
          <dd style={{ margin: 0, textTransform: 'capitalize', fontWeight: 500 }}>{billing.planKey}</dd>

          {isTrial && billing.trialEndsAt && (
            <>
              <dt style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Trial ends</dt>
              <dd style={{ margin: 0 }}>
                {new Date(billing.trialEndsAt).toLocaleDateString()}{' '}
                {billing.trialDaysLeft > 0
                  ? <span style={{ color: billing.trialDaysLeft <= 3 ? 'var(--danger)' : 'var(--muted)', fontSize: '0.85rem' }}>({billing.trialDaysLeft} day{billing.trialDaysLeft !== 1 ? 's' : ''} left)</span>
                  : <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>(expired)</span>
                }
              </dd>
            </>
          )}

          {isActive && billing.currentPeriodEnd && (
            <>
              <dt style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{billing.cancelAtPeriodEnd ? 'Cancels on' : 'Next renewal'}</dt>
              <dd style={{ margin: 0 }}>{new Date(billing.currentPeriodEnd).toLocaleDateString()}</dd>
            </>
          )}
        </dl>

        {isPastDue && (
          <p className='notice-warn' style={{ marginTop: 16, marginBottom: 0 }}>
            Your last payment failed. Please update your payment method to keep access.
          </p>
        )}
        {billing.cancelAtPeriodEnd && (
          <p className='notice-warn' style={{ marginTop: 16, marginBottom: 0 }}>
            Your subscription is set to cancel at the end of the current period. Manage your subscription to reactivate.
          </p>
        )}
      </div>

      {/* Action card */}
      <div className='policy-card' style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Actions</h2>

        {actionError && <p className='notice-error' style={{ marginBottom: 12 }}>{actionError}</p>}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!hasSub && (
            <button
              className='button button-primary'
              onClick={handleCheckout}
              disabled={actionLoading}
            >
              {actionLoading ? 'Redirecting…' : 'Upgrade to Pro'}
            </button>
          )}
          {(hasSub || isPastDue) && (
            <button
              className='button button-secondary'
              onClick={handlePortal}
              disabled={actionLoading}
            >
              {actionLoading ? 'Redirecting…' : 'Manage Subscription'}
            </button>
          )}
          {!hasSub && !isTrial && (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', alignSelf: 'center' }}>
              Your trial has ended. Upgrade to continue using the platform.
            </p>
          )}
        </div>
      </div>

      {/* FAQ / info */}
      <div className='policy-card'>
        <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>About your plan</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          <li>Your 14-day free trial includes full access to all features.</li>
          <li>After the trial, a paid subscription is required to continue.</li>
          <li>Cancel any time from the Manage Subscription portal — no lock-in.</li>
          <li>Questions? Contact support.</li>
        </ul>
      </div>
    </div>
  )
}
