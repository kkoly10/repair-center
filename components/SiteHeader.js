'use client'

import { useState } from 'react'
import StaffAuthActions from './StaffAuthActions'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import LanguageSwitcher from '../lib/i18n/LanguageSwitcher'
import { useT } from '../lib/i18n/TranslationProvider'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const t = useT()

  const navItems = [
    { href: '/how-it-works', label: t('siteHeader.navHowItWorks') },
    { href: '/repairs',      label: t('siteHeader.navRepairs') },
    { href: '/devices',      label: t('siteHeader.navDevices') },
    { href: '/track',        label: t('siteHeader.navTrack') },
    { href: '/faq',          label: t('siteHeader.navFaq') },
    { href: '/for-shops',    label: t('siteHeader.navForShops') },
  ]

  return (
    <header className='site-header'>
      <div className='site-shell site-header-inner'>
        <LocalizedLink href='/' className='brand'>
          <span className='brand-mark'>RC</span>
          <span>
            <strong>{t('common.appName')}</strong>
            <small>{t('common.tagline')}</small>
          </span>
        </LocalizedLink>

        <nav className='desktop-nav' aria-label='Primary'>
          {navItems.map((item) => (
            <LocalizedLink key={item.href} href={item.href}>
              {item.label}
            </LocalizedLink>
          ))}
        </nav>

        <div className='header-actions'>
          <LocalizedLink href='/track' className='button button-secondary button-compact'>
            {t('siteHeader.trackOrder')}
          </LocalizedLink>

          <StaffAuthActions />

          <LocalizedLink href='/estimate' className='button button-primary button-compact'>
            {t('siteHeader.freeEstimate')}
          </LocalizedLink>

          <LanguageSwitcher className='language-switcher header-language-switcher' />

          <button
            className='mobile-menu-button'
            type='button'
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={t('siteHeader.toggleMenu')}
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
              <LocalizedLink key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </LocalizedLink>
            ))}

            <LocalizedLink href='/track' className='button button-secondary' onClick={() => setOpen(false)}>
              {t('siteHeader.trackOrder')}
            </LocalizedLink>

            <StaffAuthActions mobile />

            <LocalizedLink href='/estimate' className='button button-primary' onClick={() => setOpen(false)}>
              {t('siteHeader.freeEstimate')}
            </LocalizedLink>

            <LanguageSwitcher className='language-switcher' />
          </div>
        </div>
      ) : null}
    </header>
  )
}
