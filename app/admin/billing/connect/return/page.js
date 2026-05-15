import LocalizedLink from '../../../../../lib/i18n/LocalizedLink'
import { getT } from '../../../../../lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('connectReturn.title') }
}

export default async function ConnectReturnPage() {
  const t = await getT()
  return (
    <div className='site-shell' style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 640, margin: '0 auto' }}>
      <div className='policy-card'>
        <h1 style={{ marginBottom: 12 }}>{t('connectReturn.title')}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{t('connectReturn.body')}</p>
        <LocalizedLink href='/admin/billing' className='button button-primary'>
          {t('connectReturn.goToBilling')}
        </LocalizedLink>
      </div>
    </div>
  )
}
