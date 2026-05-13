'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import AdminSignOutButton from './AdminSignOutButton'

const NAV_LINKS = [
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/sla', label: 'SLA' },
  { href: '/admin/parts', label: 'Parts' },
  { href: '/admin/staff', label: 'Staff' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/billing', label: 'Billing' },
]

const TYPE_ICONS = { quote: '💬', order: '🔧', customer: '👤' }
const TYPE_LABELS = { quote: 'Quote', order: 'Order', customer: 'Customer' }

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [billing, setBilling] = useState(null)

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    fetch('/admin/api/billing')
      .then((r) => r.json())
      .then((json) => { if (json.ok) setBilling(json.billing) })
      .catch(() => {})
  }, [])

  // Debounced search — all state updates happen inside the async callback, not synchronously
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setSearchLoading(true)
      try {
        const res = await fetch(`/admin/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        if (json.ok) setResults(json.results || [])
      } catch {
        // silent
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const dropdownOpen = searchFocused && query.length >= 2

  function handleResultClick(href) {
    setQuery('')
    setSearchFocused(false)
    setResults([])
    router.push(href)
  }

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
        {/* Brand */}
        <Link href='/admin/quotes' style={{
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--text, #fff)',
          textDecoration: 'none',
          marginRight: 20,
          flexShrink: 0,
          letterSpacing: '-0.01em',
        }}>
          RepairCenter
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '0 10px',
                  height: 48,
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent, #818cf8)' : 'var(--muted, rgba(255,255,255,0.55))',
                  textDecoration: 'none',
                  borderBottom: active ? '2px solid var(--accent, #818cf8)' : '2px solid transparent',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
                {label === 'Billing' && showUrgentBanner && (
                  <span style={{
                    marginLeft: 4,
                    width: 6,
                    height: 6,
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

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', marginLeft: 16, flex: '0 1 220px' }}>
          <input
            type='search'
            placeholder='Search…'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            style={{
              width: '100%',
              padding: '5px 10px',
              fontSize: '0.82rem',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              color: 'var(--text, #fff)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchLoading && (
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--muted)' }}>…</span>
          )}
          {dropdownOpen && results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--surface, #1e1e2e)',
              border: '1px solid var(--border, rgba(255,255,255,0.12))',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 200,
              overflow: 'hidden',
              minWidth: 280,
            }}>
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleResultClick(r.href)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text, #fff)',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>{TYPE_ICONS[r.type]}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    {r.subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--muted, rgba(255,255,255,0.5))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>}
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0, alignSelf: 'center' }}>{TYPE_LABELS[r.type]}</span>
                </button>
              ))}
            </div>
          )}
          {dropdownOpen && results.length === 0 && query.length >= 2 && !searchLoading && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--surface, #1e1e2e)',
              border: '1px solid var(--border, rgba(255,255,255,0.12))',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: '0.82rem',
              color: 'var(--muted)',
              zIndex: 200,
              minWidth: 200,
            }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Sign out */}
        <div style={{ marginLeft: 12, flexShrink: 0 }}>
          <AdminSignOutButton />
        </div>
      </nav>
    </>
  )
}
