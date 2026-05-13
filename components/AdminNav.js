'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminSignOutButton from './AdminSignOutButton'

const NAV_LINKS = [
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/parts', label: 'Parts' },
  { href: '/admin/staff', label: 'Staff' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/billing', label: 'Billing' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const [billing, setBilling] = useState(null)

  useEffect(() => {
    fetch('/admin/api/billing')
      .then((r) => r.json())
      .then((json) => { if (json.ok) setBilling(json.billing) })
      .catch(() => {})
  }, [])

  const trialDaysLeft = billing?.trialDaysLeft ?? null
  const showUrgentBanner =
    billing &&
    billing.status === 'trialing' &&
    trialDaysLeft !== null &&
    trialDaysLeft <= 7 &&
    !billing.hasActiveSubscription

  const showPastDueBanner = billing?.status === 'past_due'

  return (
    <>
      {/* Trial / past-due banners */}
      {showUrgentBanner && (
        <div style={{
          background: trialDaysLeft <= 3 ? 'var(--danger, #dc2626)' : 'var(--warn, #d97706)',
          color: '#fff',
          textAlign: 'center',
          padding: '8px 16px',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          {trialDaysLeft === 0
            ? 'Your free trial has expired.'
            : `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}.`}
          <Link href='/admin/billing' style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>
            Upgrade now
          </Link>
        </div>
      )}
      {showPastDueBanner && (
        <div style={{
          background: 'var(--danger, #dc2626)',
          color: '#fff',
          textAlign: 'center',
          padding: '8px 16px',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          Payment failed — please update your payment method to keep access.
          <Link href='/admin/billing' style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>
            Manage billing
          </Link>
        </div>
      )}

      {/* Nav bar */}
      <nav style={{
        background: 'var(--surface, #1e1e2e)',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        minHeight: 48,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Brand / logo area */}
        <Link href='/admin/quotes' style={{
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--text, #fff)',
          textDecoration: 'none',
          marginRight: 24,
          flexShrink: 0,
          letterSpacing: '-0.01em',
        }}>
          RepairCenter
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, flexWrap: 'wrap', overflow: 'hidden' }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '0 12px',
                  height: 48,
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent, #818cf8)' : 'var(--muted, rgba(255,255,255,0.55))',
                  textDecoration: 'none',
                  borderBottom: active ? '2px solid var(--accent, #818cf8)' : '2px solid transparent',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
              >
                {label}
                {label === 'Billing' && showUrgentBanner && (
                  <span style={{
                    marginLeft: 4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: trialDaysLeft <= 3 ? 'var(--danger, #dc2626)' : 'var(--warn, #d97706)',
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }} />
                )}
              </Link>
            )
          })}
        </div>

        {/* Sign out */}
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <AdminSignOutButton />
        </div>
      </nav>
    </>
  )
}
