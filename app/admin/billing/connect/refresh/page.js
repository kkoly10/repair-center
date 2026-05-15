import LocalizedLink from '../../../../../lib/i18n/LocalizedLink'
import { getT } from '../../../../../lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('connectRefresh.title') }
}

export default async function ConnectRefreshPage() {
  const t = await getT()
  return (
    <div className='site-shell' style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 640, margin: '0 auto' }}>
      <div className='policy-card'>
        <h1 style={{ marginBottom: 12 }}>{t('connectRefresh.title')}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{t('connectRefresh.body')}</p>
        <LocalizedLink href='/admin/billing' className='button button-secondary'>
          {t('connectRefresh.backToBilling')}
        </LocalizedLink>
      </div>
    </div>
  )
}
