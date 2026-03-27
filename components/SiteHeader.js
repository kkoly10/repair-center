'use client'

import Link from 'next/link'
import { useState } from 'react'
import StaffAuthActions from './StaffAuthActions'

const navItems = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/repairs', label: 'Repair Services' },
  { href: '/devices', label: 'Supported Devices' },
  { href: '/track', label: 'Track Repair' },
  { href: '/faq', label: 'FAQ' },
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
            <small>Mail-In Device Repair</small>
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

          <StaffAuthActions />

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

            <Link href='/track' className='button button-secondary' onClick={() => setOpen(false)}>
              Track Order
            </Link>

            <StaffAuthActions mobile />

            <Link href='/estimate' className='button button-primary' onClick={() => setOpen(false)}>
              Get Free Estimate
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}