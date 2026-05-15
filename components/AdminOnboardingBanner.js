'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const STEPS = [
  { key: 'accountCreated', label: 'Create your account', href: null },
  { key: 'profileComplete', label: 'Set up your shop profile', href: '/admin/settings' },
  { key: 'pricingComplete', label: 'Add a pricing rule', href: '/admin/pricing' },
  { key: 'paymentComplete', label: 'Configure payments', href: '/admin/settings' },
  { key: 'estimatesSent', label: 'Send your first estimate', href: '/admin/quotes' },
]

export default function AdminOnboardingBanner() {
  const [status, setStatus] = useState(null)
  const [collapsed, setCollapsed] = useState(
    // Lazy init from localStorage — avoids sync setState in effect
    () => typeof window !== 'undefined' && localStorage.getItem('onboarding_collapsed') === '1'
  )
  const [dismissed, setDismissed] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const celebrateTimerRef = useRef(null)

  const completedCount = status ? Object.values(status.steps).filter(Boolean).length : 0
  const allComplete = status ? completedCount === 5 : false

  useEffect(() => {
    fetch('/admin/api/onboarding/status')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setStatus(json)
          if (json.dismissedAt) setDismissed(true)
        }
      })
      .catch(() => {})

    return () => { if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current) }
  }, [])

  // Trigger celebration timer when all steps complete — runs in effect, not during render
  useEffect(() => {
    if (allComplete && !celebrated && celebrateTimerRef.current == null) {
      fetch('/admin/api/onboarding/dismiss', { method: 'POST' }).catch(() => {})
      celebrateTimerRef.current = setTimeout(() => setCelebrated(true), 4000)
    }
  }, [allComplete, celebrated])

  if (!status || dismissed || celebrated) return null

  const pct = Math.round((Math.max(completedCount, 1) / 5) * 100)

  function handleCollapse() {
    setCollapsed(true)
    localStorage.setItem('onboarding_collapsed', '1')
  }

  function handleExpand() {
    setCollapsed(false)
    localStorage.removeItem('onboarding_collapsed')
  }

  function handleDismiss() {
    setDismissed(true)
    fetch('/admin/api/onboarding/dismiss', { method: 'POST' }).catch(() => {})
  }

  if (allComplete) {
    return (
      <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface)', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success)', fontWeight: 600 }}>
          <span>✓</span>
          <span>You&apos;re all set! Your shop is ready to take its first repair.</span>
        </div>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div style={{
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: '0.85rem',
        color: 'var(--muted)',
      }}>
        <span>Getting started &middot; {pct}% complete</span>
        <button
          onClick={handleExpand}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: '0.85rem', padding: 0 }}
        >
          Expand &rarr;
        </button>
      </div>
    )
  }

  return (
    <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface)', padding: '12px 24px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Getting started</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{completedCount} of 5 complete</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleDismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.8rem', padding: '2px 6px' }}
          >
            Dismiss
          </button>
          <button
            onClick={handleCollapse}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.9rem', padding: '2px 6px', lineHeight: 1 }}
            aria-label='Collapse'
          >
            &minus;
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--line)', borderRadius: 9999, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--blue)',
          borderRadius: 9999,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STEPS.map(({ key, label, href }) => {
          const done = status.steps[key]
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
              <span style={{ width: 16, flexShrink: 0, color: done ? 'var(--success)' : 'var(--muted)', fontWeight: done ? 700 : 400 }}>
                {done ? '✓' : '○'}
              </span>
              {done || !href
                ? <span style={{ color: done ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
                : <Link href={href} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{label}</Link>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
