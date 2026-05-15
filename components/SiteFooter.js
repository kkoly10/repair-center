'use client'

import StaffAuthActions from './StaffAuthActions'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function SiteFooter() {
  const t = useT()

  return (
    <footer className='site-footer'>
      <div className='site-shell footer-grid'>
        <div>
          <div className='brand footer-brand'>
            <span className='brand-mark'>RC</span>
            <span>
              <strong>{t('common.appName')}</strong>
              <small>{t('common.tagline')}</small>
            </span>
          </div>
          <p className='footer-copy'>{t('siteFooter.description')}</p>
        </div>

        <div>
          <h4>{t('siteFooter.startHere')}</h4>
          <div className='footer-links'>
            <LocalizedLink href='/estimate'>{t('siteFooter.freeEstimateLink')}</LocalizedLink>
            <LocalizedLink href='/how-it-works'>{t('siteFooter.howItWorksLink')}</LocalizedLink>
            <LocalizedLink href='/track'>{t('siteFooter.trackLink')}</LocalizedLink>
            <LocalizedLink href='/faq'>{t('siteFooter.faqLink')}</LocalizedLink>
          </div>
        </div>

        <div>
          <h4>{t('siteFooter.explore')}</h4>
          <div className='footer-links'>
            <LocalizedLink href='/repairs'>{t('siteFooter.repairsLink')}</LocalizedLink>
            <LocalizedLink href='/devices'>{t('siteFooter.devicesLink')}</LocalizedLink>
            <LocalizedLink href='/for-shops'>{t('siteFooter.forShopsLink')}</LocalizedLink>
            <LocalizedLink href='/contact'>{t('siteFooter.contactLink')}</LocalizedLink>
          </div>
        </div>

        <div>
          <h4>{t('siteFooter.policies')}</h4>
          <div className='footer-links'>
            <LocalizedLink href='/terms'>{t('siteFooter.termsLink')}</LocalizedLink>
            <LocalizedLink href='/platform-terms'>{t('siteFooter.platformTermsLink')}</LocalizedLink>
            <LocalizedLink href='/privacy'>{t('siteFooter.privacyLink')}</LocalizedLink>
            <LocalizedLink href='/shop-responsibility'>{t('siteFooter.shopResponsibilityLink')}</LocalizedLink>
            <LocalizedLink href='/returns'>{t('siteFooter.returnsLink')}</LocalizedLink>
            <LocalizedLink href='/data-privacy'>{t('siteFooter.dataPrivacyLink')}</LocalizedLink>
          </div>
        </div>

        <div>
          <h4>{t('siteFooter.staff')}</h4>
          <div className='footer-links'>
            <StaffAuthActions />
          </div>
        </div>
      </div>
    </footer>
  )
}
