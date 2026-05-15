'use client'

import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n/TranslationProvider'

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
  const t = useT()
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
      else setError(billingJson.error || t('adminBilling.loadFailed'))
      if (!connectJson.error) setConnect(connectJson)
    }).catch(() => setError(t('adminBilling.loadFailed'))).finally(() => {
      setLoading(false)
      setConnectLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setActionError(json.error || t('adminBilling.unableToStartCheckout'))
      }
    } catch {
      setActionError(t('adminBilling.unableToStartCheckout'))
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
        setActionError(json.error || t('adminBilling.unableToOpenPortal'))
      }
    } catch {
      setActionError(t('adminBilling.unableToOpenPortal'))
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
        setConnectActionError(json.error || t('adminBilling.unableToStartOnboarding'))
      }
    } catch {
      setConnectActionError(t('adminBilling.unableToStartOnboarding'))
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
      setConnectActionError(t('adminBilling.unableToRefreshStatus'))
    } finally {
      setConnectActionLoading(false)
    }
  }

  if (loading) return <div className='site-shell' style={{ paddingTop: 40 }}><p>{t('adminBilling.loading')}</p></div>
  if (error) return <div className='site-shell' style={{ paddingTop: 40 }}><p className='notice-error'>{error}</p></div>

  const isTrial = billing.status === 'trialing'
  const isPastDue = billing.status === 'past_due'
  const isActive = billing.status === 'active'
  const hasSub = billing.hasActiveSubscription

  return (
    <div className='site-shell' style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 700 }}>
      <h1 style={{ marginBottom: 24 }}>{t('adminBilling.heading')}</h1>

      {/* Status card */}
      <div className='policy-card' style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('adminBilling.currentPlan')}</h2>
          <StatusBadge status={billing.status} />
        </div>

        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 24px', margin: 0 }}>
          <dt style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('adminBilling.planField')}</dt>
          <dd style={{ margin: 0, textTransform: 'capitalize', fontWeight: 500 }}>{billing.planKey}</dd>

          {isTrial && billing.trialEndsAt && (
            <>
              <dt style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('adminBilling.trialEndsField')}</dt>
              <dd style={{ margin: 0 }}>
                {new Date(billing.trialEndsAt).toLocaleDateString()}{' '}
                {billing.trialDaysLeft > 0
                  ? <span style={{ color: billing.trialDaysLeft <= 3 ? 'var(--danger)' : 'var(--muted)', fontSize: '0.85rem' }}>{billing.trialDaysLeft === 1 ? t('adminBilling.trialDaysLeftSingular', { days: billing.trialDaysLeft }) : t('adminBilling.trialDaysLeftPlural', { days: billing.trialDaysLeft })}</span>
                  : <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{t('adminBilling.trialExpiredShort')}</span>
                }
              </dd>
            </>
          )}

          {isActive && billing.currentPeriodEnd && (
            <>
              <dt style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{billing.cancelAtPeriodEnd ? t('adminBilling.cancelsOnField') : t('adminBilling.renewalField')}</dt>
              <dd style={{ margin: 0 }}>{new Date(billing.currentPeriodEnd).toLocaleDateString()}</dd>
            </>
          )}
        </dl>

        {isPastDue && (
          <p className='notice-warn' style={{ marginTop: 16, marginBottom: 0 }}>
            {t('adminBilling.pastDuePleaseUpdate')}
          </p>
        )}
        {billing.cancelAtPeriodEnd && (
          <p className='notice-warn' style={{ marginTop: 16, marginBottom: 0 }}>
            {t('adminBilling.cancelScheduled')}
          </p>
        )}
      </div>

      {/* Action card */}
      <div className='policy-card' style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>{t('adminBilling.actionsTitle')}</h2>

        {actionError && <p className='notice-error' style={{ marginBottom: 12 }}>{actionError}</p>}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!hasSub && (
            <button
              className='button button-primary'
              onClick={handleCheckout}
              disabled={actionLoading}
            >
              {actionLoading ? t('adminBilling.redirecting') : t('adminBilling.subscribeBeta')}
            </button>
          )}
          {(hasSub || isPastDue) && (
            <button
              className='button button-secondary'
              onClick={handlePortal}
              disabled={actionLoading}
            >
              {actionLoading ? t('adminBilling.redirecting') : t('adminBilling.manageSubscription')}
            </button>
          )}
          {!hasSub && !isTrial && (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', alignSelf: 'center' }}>
              {t('adminBilling.trialEndedHint')}
            </p>
          )}
        </div>
      </div>

      {/* Accept Payments — Stripe Connect */}
      <div className='policy-card' style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{t('adminBilling.acceptCardTitle')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          {t('adminBilling.acceptCardSubtitle')}
        </p>

        {connectLoading && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('adminBilling.loadingDots')}</p>}

        {!connectLoading && connect && !connect.connected && (
          <div>
            <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>
              {t('adminBilling.noStripeAccount')}
            </p>
            {connectActionError && <p className='notice-error' style={{ marginBottom: 12 }}>{connectActionError}</p>}
            <button className='button button-primary' onClick={handleConnectOnboard} disabled={connectActionLoading}>
              {connectActionLoading ? t('adminBilling.redirecting') : t('adminBilling.connectStripeAccount')}
            </button>
          </div>
        )}

        {!connectLoading && connect && connect.connected && !connect.chargesEnabled && (
          <div>
            <p className='notice-warn' style={{ marginBottom: 12 }}>
              {t('adminBilling.stripeSetupInProgress')}
            </p>
            {connectActionError && <p className='notice-error' style={{ marginBottom: 12 }}>{connectActionError}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className='button button-primary' onClick={handleConnectOnboard} disabled={connectActionLoading}>
                {connectActionLoading ? t('adminBilling.redirecting') : t('adminBilling.resumeSetup')}
              </button>
              <button className='button button-secondary' onClick={handleConnectRefresh} disabled={connectActionLoading}>
                {t('adminBilling.refreshStatusBtn')}
              </button>
            </div>
          </div>
        )}

        {!connectLoading && connect && connect.connected && connect.chargesEnabled && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--success)', color: '#fff', borderRadius: 9999, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
                {t('adminBilling.connectedBadge')}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {connect.accountId?.slice(0, 8)}…{connect.accountId?.slice(-4)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <CapabilityDot enabled={connect.chargesEnabled} label={t('adminBilling.chargesLabel')} />
              <CapabilityDot enabled={connect.payoutsEnabled} label={t('adminBilling.payoutsLabel')} />
            </div>
            <div className='notice-info' style={{ marginBottom: 12, fontSize: '0.85rem' }}>
              {t('adminBilling.platformFeeFooter')}
            </div>
            {connectActionError && <p className='notice-error' style={{ marginBottom: 12 }}>{connectActionError}</p>}
            <button className='button button-secondary' onClick={handleConnectRefresh} disabled={connectActionLoading}>
              {connectActionLoading ? t('adminBilling.refreshing') : t('adminBilling.refreshStatusBtn')}
            </button>
          </div>
        )}
      </div>

      {/* FAQ / info */}
      <div className='policy-card'>
        <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{t('adminBilling.aboutPlanTitle')}</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          <li>{t('adminBilling.aboutPlan1')}</li>
          <li>{t('adminBilling.aboutPlan2')}</li>
          <li>{t('adminBilling.aboutPlan3')}</li>
          <li>{t('adminBilling.aboutPlan4')}</li>
          <li>{t('adminBilling.aboutPlan5Prefix')} <a href='/platform-terms'>{t('adminBilling.aboutPlan5Link')}</a> {t('adminBilling.aboutPlan5Suffix')}</li>
        </ul>
      </div>
    </div>
  )
}
