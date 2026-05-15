import { getT } from '../lib/i18n/server'
import LocalizedLink from '../lib/i18n/LocalizedLink'

export async function generateMetadata() {
  const t = await getT()
  return { title: `${t('errors.notFound')} — Repair Center` }
}

export default async function NotFound() {
  const t = await getT()
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack' style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className='kicker'>404</div>
        <h1>{t('errors.notFound')}</h1>
        <p style={{ color: 'var(--text-muted, #666)', maxWidth: 480, margin: '0 auto 2rem' }}>
          {t('errors.notFoundText')}
        </p>
        <div className='inline-actions' style={{ justifyContent: 'center' }}>
          <LocalizedLink href='/' className='button button-primary'>
            {t('errors.goHome')}
          </LocalizedLink>
        </div>
      </div>
    </main>
  )
}
