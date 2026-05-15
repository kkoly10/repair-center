'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import AdminSignOutButton from './AdminSignOutButton'
import FeedbackButton from './FeedbackButton'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

const NAV_SECTIONS = [
  {
    sectionKey: 'sectionCustomer',
    items: [
      { href: '/admin/quotes',       labelKey: 'quotes',       icon: '💬', badgeKey: 'unreviewed' },
      { href: '/admin/appointments', labelKey: 'appointments', icon: '📅', badgeKey: 'appointments' },
      { href: '/admin/customers',    labelKey: 'customers',    icon: '👥' },
    ],
  },
  {
    sectionKey: 'sectionOperations',
    items: [
      { href: '/admin/orders',  labelKey: 'orders',  icon: '🔧' },
      { href: '/admin/walkin',  labelKey: 'walkin',  icon: '🏪' },
      { href: '/admin/parts',   labelKey: 'parts',   icon: '⚙️' },
      { href: '/admin/catalog', labelKey: 'catalog', icon: '📋' },
    ],
  },
  {
    sectionKey: 'sectionBusiness',
    items: [
      { href: '/admin/analytics', labelKey: 'analytics', icon: '📊' },
      { href: '/admin/sla',       labelKey: 'sla',       icon: '⏱' },
      { href: '/admin/reviews',   labelKey: 'reviews',   icon: '⭐' },
      { href: '/admin/staff',     labelKey: 'staff',     icon: '👔' },
    ],
  },
  {
    sectionKey: 'sectionAccount',
    items: [
      { href: '/admin/settings', labelKey: 'settings', icon: '🔩' },
      { href: '/admin/team',     labelKey: 'team',     icon: '🫂' },
      { href: '/admin/billing',  labelKey: 'billing',  icon: '💳', badgeKey: 'billing' },
    ],
  },
]

const TYPE_ICONS = { quote: '💬', order: '🔧', customer: '👤' }
const TYPE_LABEL_KEYS = { quote: 'searchTypeQuote', order: 'searchTypeOrder', customer: 'searchTypeCustomer' }

export default function AdminSidebar() {
  const t = useT()
  const pathname = usePathname()
  const router   = useRouter()

  const [billing,          setBilling]          = useState(null)
  const [orgId,            setOrgId]            = useState(null)
  const [unreviewedCount,  setUnreviewedCount]  = useState(0)
  const [pendingAppts,     setPendingAppts]      = useState(0)
  const [mobileOpen,       setMobileOpen]        = useState(false)

  const [query,         setQuery]         = useState('')
  const [results,       setResults]       = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef  = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    fetch('/admin/api/billing')
      .then((r) => r.json())
      .then((json) => { if (json.ok) { setBilling(json.billing); setOrgId(json.orgId || null) } })
      .catch(() => {})
    fetch('/admin/api/quotes/unreviewed-count')
      .then((r) => r.json())
      .then((json) => { if (typeof json.count === 'number') setUnreviewedCount(json.count) })
      .catch(() => {})
    fetch('/admin/api/appointments/count')
      .then((r) => r.json())
      .then((json) => { if (typeof json.count === 'number') setPendingAppts(json.count) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) { setResults([]); return }
      setSearchLoading(true)
      try {
        const res  = await fetch(`/admin/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        if (json.ok) setResults(json.results || [])
      } catch { /* silent */ } finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => {
    const t = setTimeout(() => setMobileOpen(false), 0)
    return () => clearTimeout(t)
  }, [pathname])

  const dropdownOpen   = searchFocused && query.length >= 2
  const trialDaysLeft  = billing?.trialDaysLeft ?? null
  const isTrialUrgent  = billing?.status === 'trialing' && trialDaysLeft !== null && trialDaysLeft <= 7 && !billing?.hasActiveSubscription
  const isPastDue      = billing?.status === 'past_due'

  function handleResultClick(href) {
    setQuery(''); setSearchFocused(false); setResults([])
    router.push(href)
  }

  function badge(key) {
    if (key === 'unreviewed')   return unreviewedCount > 0  ? (unreviewedCount  > 99 ? '99+' : String(unreviewedCount))  : null
    if (key === 'appointments') return pendingAppts > 0     ? (pendingAppts      > 99 ? '99+' : String(pendingAppts))     : null
    return null
  }

  function billingDot() {
    if (!isTrialUrgent && !isPastDue) return null
    const color = (isPastDue || trialDaysLeft <= 3) ? '#ef4444' : '#f59e0b'
    return <span className='sidebar-dot' style={{ background: color }} />
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button className='sidebar-hamburger' onClick={() => setMobileOpen((o) => !o)} aria-label={t('adminNav.menuAria')}>
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay on mobile when open */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      <aside className={`admin-sidebar${mobileOpen ? ' open' : ''}`}>

        {/* Trial / past-due banners */}
        {isTrialUrgent && (
          <div style={{
            background: trialDaysLeft <= 3 ? '#dc2626' : '#d97706',
            color: '#fff', fontSize: '0.75rem', padding: '8px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <span>
              {trialDaysLeft === 0 ? t('adminNav.trialExpired') : t('adminNav.trialLeftShort', { days: trialDaysLeft })}
            </span>
            <LocalizedLink href='/admin/billing' style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
              {t('adminNav.upgradeShort')}
            </LocalizedLink>
          </div>
        )}
        {isPastDue && (
          <div style={{
            background: '#dc2626', color: '#fff', fontSize: '0.75rem',
            padding: '8px 14px',
          }}>
            {t('adminNav.paymentFailedShort')}{' '}
            <LocalizedLink href='/admin/billing' style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>
              {t('adminNav.fixNow')}
            </LocalizedLink>
          </div>
        )}

        {/* Logo */}
        <LocalizedLink href='/admin/quotes' className='sidebar-logo'>
          <span className='sidebar-logo-mark'>R</span>
          <span>{t('adminNav.logoText')}</span>
        </LocalizedLink>

        {/* Search */}
        <div ref={searchRef} className='sidebar-search-wrap' style={{ position: 'relative' }}>
          <input
            type='search'
            className='sidebar-search'
            placeholder={t('adminNav.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
          />
          {searchLoading && (
            <span style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>…</span>
          )}
          {dropdownOpen && (results.length > 0 ? (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 12, right: 12,
              background: 'var(--surface-dark-soft)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 300, overflow: 'hidden',
            }}>
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleResultClick(r.href)}
                  style={{
                    width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'flex-start',
                    gap: 9, background: 'none', border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', textAlign: 'left', color: '#fff',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', flexShrink: 0, marginTop: 1 }}>{TYPE_ICONS[r.type]}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    {r.subtitle && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>}
                  </div>
                  <span style={{ marginLeft: 4, fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', flexShrink: 0, alignSelf: 'center' }}>{t(`adminNav.${TYPE_LABEL_KEYS[r.type]}`)}</span>
                </button>
              ))}
            </div>
          ) : query.length >= 2 && !searchLoading ? (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 12, right: 12,
              background: 'var(--surface-dark-soft)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', zIndex: 300,
            }}>
              {t('adminNav.noResultsFor', { query })}
            </div>
          ) : null)}
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, paddingBottom: 8 }}>
          {NAV_SECTIONS.map(({ sectionKey, items }) => (
            <div key={sectionKey}>
              <div className='sidebar-section-label'>{t(`adminNav.${sectionKey}`)}</div>
              {items.map(({ href, labelKey, icon, badgeKey }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                const cnt    = badgeKey ? badge(badgeKey) : null
                const dot    = badgeKey === 'billing' ? billingDot() : null
                return (
                  <LocalizedLink
                    key={href}
                    href={href}
                    className={`sidebar-nav-link${active ? ' active' : ''}`}
                  >
                    <span className='sidebar-icon'>{icon}</span>
                    <span className='sidebar-label'>{t(`adminNav.${labelKey}`)}</span>
                    {cnt  && <span className='sidebar-badge'>{cnt}</span>}
                    {dot}
                  </LocalizedLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '8px 12px 20px', borderTop: '1px solid var(--line-dark)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FeedbackButton orgId={orgId} />
          <AdminSignOutButton />
        </div>
      </aside>
    </>
  )
}
