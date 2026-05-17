'use client'

import { useEffect, useState } from 'react'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { statusPill } from '../lib/statusPills'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PlatformOrgDetailPage({ orgId }) {
  const t = useT()
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [actionError, setActionError] = useState('')
  const [actionMsg,   setActionMsg]   = useState('')
  const [acting,      setActing]      = useState(false)
  const [suspendConfirm, setSuspendConfirm] = useState(false)

  async function loadData() {
    const res  = await fetch(`/platform/api/orgs/${orgId}`)
    const json = await res.json()
    if (json.ok) setData(json)
    else setError(json.error || t('platformAdmin.loadOrgError'))
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      loadData().catch(() => setError(t('platformAdmin.loadOrgError'))).finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  async function doAction(action, extra = {}) {
    setActing(true); setActionError(''); setActionMsg('')
    try {
      const res  = await fetch(`/platform/api/orgs/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('platformAdmin.actionFailed'))
      setActionMsg(t('platformAdmin.actionDone', { status: json.status }))
      await loadData()
    } catch (err) {
      setActionError(err.message || t('platformAdmin.actionFailed'))
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className='notice' style={{ margin: 32 }}>{t('platformAdmin.loading')}</div>
  if (error)   return <div className='notice notice-warn' style={{ margin: 32 }}>{error}</div>

  const { org, subscription, members, usage, recentQuotes, trialDaysLeft } = data
  const isSuspendable = !['suspended', 'cancelled'].includes(org.status)

  const billingRows = [
    { label: t('platformAdmin.labelStatusValue'), value: <span className={statusPill(org.status).cls}>{statusPill(org.status).label}</span> },
    { label: t('platformAdmin.labelPlanValue'),   value: subscription?.plan_key || org.plan_key || t('platformAdmin.planTrial') },
    { label: t('platformAdmin.labelTrialEnds'),   value: org.trial_ends_at
        ? `${fmtDate(org.trial_ends_at)}${trialDaysLeft !== null ? ` (${trialDaysLeft > 0 ? t('platformAdmin.labelTrialRemaining', { days: trialDaysLeft }) : t('platformAdmin.trialExpired')})` : ''}`
        : '—' },
    { label: t('platformAdmin.labelRenewal'),    value: fmtDate(subscription?.current_period_end) },
    { label: t('platformAdmin.labelStripeId'),   value: org.stripe_customer_id
        ? <span className='id-mono' style={{ fontSize: '0.78rem' }}>{org.stripe_customer_id}</span>
        : '—' },
    { label: t('platformAdmin.labelJoined'),     value: fmtDate(org.created_at) },
  ]

  const activeMembers = members.filter((m) => m.status === 'active')

  return (
    <div className='page-stack' style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <LocalizedLink href='/platform/orgs' style={{ fontSize: '0.82rem', color: 'var(--muted)', textDecoration: 'none' }}>
            {t('platformAdmin.backToOrgs')}
          </LocalizedLink>
          <h1 style={{ margin: '6px 0 4px', letterSpacing: '-0.02em' }}>{org.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className='id-mono' style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{org.slug}</span>
            <span className={statusPill(org.status).cls}>{statusPill(org.status).label}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {isSuspendable ? (
            suspendConfirm ? (
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: '#b91c1c' }}>{t('platformAdmin.suspendConfirm', { name: org.name })}</span>
                <button
                  className='button button-secondary'
                  style={{ fontSize: '0.82rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                  disabled={acting}
                  onClick={() => { setSuspendConfirm(false); doAction('suspend') }}
                >{t('platformAdmin.confirmYes')}</button>
                <button
                  className='button button-secondary'
                  style={{ fontSize: '0.82rem' }}
                  disabled={acting}
                  onClick={() => setSuspendConfirm(false)}
                >{t('platformAdmin.confirmNo')}</button>
              </span>
            ) : (
              <button
                className='button button-secondary'
                style={{ fontSize: '0.82rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                disabled={acting}
                onClick={() => setSuspendConfirm(true)}
              >
                {t('platformAdmin.actionSuspend')}
              </button>
            )
          ) : (
            <button
              className='button button-secondary'
              style={{ fontSize: '0.82rem' }}
              disabled={acting}
              onClick={() => doAction('reactivate')}
            >
              {t('platformAdmin.actionReactivate')}
            </button>
          )}
          <button
            className='button button-secondary'
            style={{ fontSize: '0.82rem' }}
            disabled={acting}
            onClick={() => doAction('extend_trial', { days: 7 })}
          >
            {t('platformAdmin.extendTrial7d')}
          </button>
        </div>
      </div>

      {actionMsg   && <div className='notice'>{actionMsg}</div>}
      {actionError && <div className='notice notice-warn'>{actionError}</div>}

      {/* Usage stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: t('platformAdmin.labelQuotes'),    value: usage.quotes },
          { label: t('platformAdmin.labelOrders'),    value: usage.orders },
          { label: t('platformAdmin.labelCustomers'), value: usage.customers },
          { label: t('platformAdmin.tableMembers'),   value: activeMembers.length },
        ].map(({ label, value }) => (
          <div key={label} className='policy-card' style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Billing */}
      <div className='policy-card'>
        <div className='kicker'>{t('platformAdmin.labelBilling')}</div>
        <h3 style={{ margin: '2px 0 14px' }}>{t('platformAdmin.labelSubscription')}</h3>
        <div className='preview-meta'>
          {billingRows.map(({ label, value }) => (
            <div key={label} className='preview-meta-row'>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{label}</span>
              <span style={{ fontSize: '0.875rem' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Members */}
      <div className='policy-card'>
        <div className='kicker'>{t('platformAdmin.labelTeam')}</div>
        <h3 style={{ margin: '2px 0 14px' }}>{t('platformAdmin.labelMembers', { count: members.length })}</h3>
        <div className='preview-meta'>
          {members.length === 0 ? (
            <div className='preview-meta-row'>
              <span style={{ color: 'var(--muted)' }}>{t('platformAdmin.noMembers')}</span>
              <span>—</span>
            </div>
          ) : members.map((m) => (
            <div key={m.id} className='preview-meta-row'>
              <span>
                <span style={{ fontWeight: m.status === 'active' ? 600 : 400 }}>
                  {m.profile?.full_name || m.profile?.email || t('platformAdmin.memberUnknown')}
                </span>
                {m.profile?.email && m.profile.full_name && (
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                    {m.profile.email}
                  </span>
                )}
              </span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{m.role}</span>
                {m.status !== 'active' && (
                  <span className='pill pill-inactive'>{m.status}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent quotes */}
      {recentQuotes.length > 0 && (
        <div className='policy-card'>
          <div className='kicker'>{t('platformAdmin.labelActivity')}</div>
          <h3 style={{ margin: '2px 0 14px' }}>{t('platformAdmin.labelRecentQuotes')}</h3>
          <div className='preview-meta'>
            {recentQuotes.map((q) => (
              <div key={q.id} className='preview-meta-row'>
                <span>
                  <span className='id-mono' style={{ fontSize: '0.78rem', marginRight: 8 }}>{q.quote_id}</span>
                  {[q.brand_name, q.model_name, q.repair_type_key?.replace(/_/g, ' ')].filter(Boolean).join(' · ')}
                </span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={statusPill(q.status).cls}>{statusPill(q.status).label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(q.created_at)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
