import LocalizedLink from '../../../lib/i18n/LocalizedLink'
import { getT } from '../../../lib/i18n/server'

export default async function SuspendedPage() {
  const t = await getT()
  return (
    <main className='page-hero'>
      <div className='site-shell'>
        <div className='policy-card center-card' style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div className='kicker'>{t('adminSuspended.kicker')}</div>
          <h1>{t('adminSuspended.title')}</h1>
          <p style={{ marginTop: 12 }}>
            {t('adminSuspended.bodyMain')}
          </p>
          <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.9rem' }}>
            {t('adminSuspended.bodyHelper')}
          </p>
          <div className='inline-actions' style={{ marginTop: 24, justifyContent: 'center' }}>
            <LocalizedLink href='/admin/billing' className='button button-primary'>
              {t('adminSuspended.billingLink')}
            </LocalizedLink>
            <LocalizedLink href='/admin/login' className='button button-secondary'>
              {t('adminSuspended.signInDifferent')}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </main>
  )
}
