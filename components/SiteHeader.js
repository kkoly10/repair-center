'use client'

import Link from 'next/link'
import { useState } from 'react'

const navItems = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/repairs', label: 'Repairs' },
  { href: '/devices', label: 'Devices' },
  { href: '/track', label: 'Track Repair' },
  { href: '/faq', label: 'Support' },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className='site-header'>
      <div className='site-shell site-header-inner'>
        <Link href='/' className='brand'>
          <span className='brand-mark'>RC</span>
          <span>
            <strong>Repair Center</strong>
            <small>Mail-In Tech Repair</small>
          </span>
        </Link>

        <nav className='desktop-nav' aria-label='Primary'>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className='header-actions'>
          <Link href='/track' className='button button-secondary button-compact'>
            Track Order
          </Link>
          <Link href='/estimate' className='button button-primary button-compact'>
            Get Free Estimate
          </Link>
          <button
            className='mobile-menu-button'
            type='button'
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label='Toggle menu'
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {open ? (
        <div className='mobile-panel'>
          <div className='site-shell mobile-panel-inner'>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href='/estimate' className='button button-primary' onClick={() => setOpen(false)}>
              Get Free Estimate
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
