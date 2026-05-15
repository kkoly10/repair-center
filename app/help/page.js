import HelpSearch from '../../components/HelpSearch'
import HelpCategoryGrid from '../../components/HelpCategoryGrid'
import { HELP_CATEGORIES } from '../../lib/helpContent'
import { getT } from '../../lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return {
    title: t('helpCenter.metaTitle'),
    description: t('helpCenter.metaDescription'),
  }
}

export default async function HelpHomePage() {
  const t = await getT()
  const operatorCategories = HELP_CATEGORIES.filter((c) => c.audience === 'operator')
  const customerCategories = HELP_CATEGORIES.filter((c) => c.audience === 'customer')

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'var(--blue)', padding: '56px 24px 64px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '0 0 10px', fontWeight: 800 }}>
          {t('helpCenter.heroTitle')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.82)', margin: '0 0 28px', fontSize: '1.05rem' }}>
          {t('helpCenter.heroSubtitle')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HelpSearch />
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 64px' }}>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            {t('helpCenter.operatorsHeading')}
          </h2>
          <HelpCategoryGrid categories={operatorCategories} />
        </section>

        <section>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            {t('helpCenter.customersHeading')}
          </h2>
          <HelpCategoryGrid categories={customerCategories} />
        </section>

      </div>
    </div>
  )
}
