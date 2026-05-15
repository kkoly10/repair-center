import LocalizedLink from '../../lib/i18n/LocalizedLink'
import { getT } from '../../lib/i18n/server'
import SiteFooter from '../../components/SiteFooter'

export async function generateMetadata() {
  const t = await getT()
  return {
    title: { default: t('helpCenter.metaTitle'), template: t('helpCenter.metaTemplate') },
    description: t('helpCenter.metaDescription'),
  }
}

export default async function HelpLayout({ children }) {
  const t = await getT()
  return (
    <>
      <header style={{
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, height: 56 }}>
          <LocalizedLink href='/help' style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            {t('helpCenter.layoutTitle')}
          </LocalizedLink>
          <span style={{ color: 'var(--line)', fontSize: 18 }}>|</span>
          <LocalizedLink href='/' style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>{t('helpCenter.backToSite')}</LocalizedLink>
        </div>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}
