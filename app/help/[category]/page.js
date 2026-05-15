import { notFound } from 'next/navigation'
import LocalizedLink from '../../../lib/i18n/LocalizedLink'
import { getT } from '../../../lib/i18n/server'
import { CATEGORY_MAP, getArticlesByCategory } from '../../../lib/helpContent'
import HelpArticleList from '../../../components/HelpArticleList'

export async function generateMetadata({ params }) {
  const { category } = await params
  const cat = CATEGORY_MAP[category]
  if (!cat) return {}
  return {
    title: cat.title,
    description: cat.description,
  }
}

export default async function HelpCategoryPage({ params }) {
  const { category } = await params
  const cat = CATEGORY_MAP[category]
  if (!cat) notFound()
  const t = await getT()

  const articles = getArticlesByCategory(category)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 64px' }}>

      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
        <LocalizedLink href='/help' style={{ color: 'var(--blue)', textDecoration: 'none' }}>{t('helpCenter.breadcrumb')}</LocalizedLink>
        <span>›</span>
        <span>{cat.title}</span>
      </nav>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>{cat.icon}</div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, margin: '0 0 10px' }}>{cat.title}</h1>
        <p style={{ fontSize: '1rem', color: 'var(--muted)', margin: 0 }}>{cat.description}</p>
      </div>

      <HelpArticleList articles={articles} category={category} />

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <LocalizedLink href='/help' style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>{t('helpCenter.allCategories')}</LocalizedLink>
      </div>
    </div>
  )
}
