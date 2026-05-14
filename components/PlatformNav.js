'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/platform',       label: 'Dashboard' },
  { href: '/platform/orgs',  label: 'Organizations' },
]

export default function PlatformNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 52, zIndex: 100,
      background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 8,
    }}>
      <span style={{
        color: '#fff', fontWeight: 700, fontSize: '0.9rem',
        letterSpacing: '-0.01em', marginRight: 16, flexShrink: 0,
      }}>
        ⚡ Platform Console
      </span>
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href || (href !== '/platform' && pathname.startsWith(href + '/'))
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: '5px 12px', borderRadius: 6,
              fontSize: '0.875rem', textDecoration: 'none',
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              fontWeight: active ? 600 : 400,
              background: active ? 'rgba(255,255,255,0.10)' : 'none',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
