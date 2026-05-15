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

function CapabilityDot({ enabled, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: 'var(--muted)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: enabled ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
      {label}
    </span>
  )
}

export default function AdminBillingPage() {
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const [connect, setConnect] = useState(null)
  const [connectLoading, setConnectLoading] = useState(true)
  const [connectActionLoading, setConnectActionLoading] = useState(false)
  const [connectActionError, setConnectActionError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/admin/api/billing').then((r) => r.json()),
      fetch('/admin/api/billing/connect/status').then((r) => r.json()),
    ]).then(([billingJson, connectJson]) => {
      if (billingJson.ok) setBilling(billingJson.billing)
      else setError(billingJson.error || 'Failed to load billing.')
      if (!connectJson.error) setConnect(connectJson)
    }).catch(() => setError('Failed to load billing.')).finally(() => {
      setLoading(false)
      setConnectLoading(false)
    })
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

  async function handleConnectOnboard() {
    setConnectActionLoading(true)
    setConnectActionError('')
    try {
      const res = await fetch('/admin/api/billing/connect/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setConnectActionError(json.error || 'Unable to start Stripe onboarding.')
      }
    } catch {
      setConnectActionError('Unable to start Stripe onboarding.')
    } finally {
      setConnectActionLoading(false)
    }
  }

  async function handleConnectRefresh() {
    setConnectActionLoading(true)
    setConnectActionError('')
    try {
      const res = await fetch('/admin/api/billing/connect/status')
      const json = await res.json()
      if (!json.error) setConnect(json)
    } catch {
      setConnectActionError('Unable to refresh status.')
    } finally {
      setConnectActionLoading(false)
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
              {actionLoading ? 'Redirecting…' : 'Subscribe — Founder Beta ($29/mo)'}
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

      {/* Accept Payments — Stripe Connect */}
      <div className='policy-card' style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Accept Card Payments</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Connect your own Stripe account to accept card payments directly. RepairCenter earns a 0.75% platform fee on each transaction.
        </p>

        {connectLoading && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading…</p>}

        {!connectLoading && connect && !connect.connected && (
          <div>
            <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>
              No Stripe account connected. Click below to link your Stripe account via Stripe&apos;s secure onboarding.
            </p>
            {connectActionError && <p className='notice-error' style={{ marginBottom: 12 }}>{connectActionError}</p>}
            <button className='button button-primary' onClick={handleConnectOnboard} disabled={connectActionLoading}>
              {connectActionLoading ? 'Redirecting…' : 'Connect Stripe Account'}
            </button>
          </div>
        )}

        {!connectLoading && connect && connect.connected && !connect.chargesEnabled && (
          <div>
            <p className='notice-warn' style={{ marginBottom: 12 }}>
              Your Stripe account setup is in progress. Finish the onboarding to enable card payments.
            </p>
            {connectActionError && <p className='notice-error' style={{ marginBottom: 12 }}>{connectActionError}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className='button button-primary' onClick={handleConnectOnboard} disabled={connectActionLoading}>
                {connectActionLoading ? 'Redirecting…' : 'Resume Setup'}
              </button>
              <button className='button button-secondary' onClick={handleConnectRefresh} disabled={connectActionLoading}>
                Refresh Status
              </button>
            </div>
          </div>
        )}

        {!connectLoading && connect && connect.connected && connect.chargesEnabled && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--success)', color: '#fff', borderRadius: 9999, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
                ✓ Connected
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {connect.accountId?.slice(0, 8)}…{connect.accountId?.slice(-4)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <CapabilityDot enabled={connect.chargesEnabled} label='Charges' />
              <CapabilityDot enabled={connect.payoutsEnabled} label='Payouts' />
            </div>
            <div className='notice-info' style={{ marginBottom: 12, fontSize: '0.85rem' }}>
              RepairCenter earns 0.75% on payments processed through your connected account.
            </div>
            {connectActionError && <p className='notice-error' style={{ marginBottom: 12 }}>{connectActionError}</p>}
            <button className='button button-secondary' onClick={handleConnectRefresh} disabled={connectActionLoading}>
              {connectActionLoading ? 'Refreshing…' : 'Refresh Status'}
            </button>
          </div>
        )}
      </div>

      {/* FAQ / info */}
      <div className='policy-card'>
        <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>About your plan</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          <li>Your 14-day free trial includes full access to every feature in the product today.</li>
          <li>No credit card is required during the trial. Your account will not be charged unless you add a payment method.</li>
          <li>After the trial, a paid subscription is required to continue. Founder Beta is $29/month.</li>
          <li>Cancel any time from the Manage Subscription portal — no contract, no lock-in. Cancellation takes effect at the end of the current billing period.</li>
          <li>See the <a href='/platform-terms'>Platform Terms</a> for full subscription terms.</li>
        </ul>
      </div>
    </div>
  )
}
