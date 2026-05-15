import LocalizedLink from '../../lib/i18n/LocalizedLink'
import { getT } from '../../lib/i18n/server'
import PublicFeedbackForm from '../../components/PublicFeedbackForm'
import SiteFooter from '../../components/SiteFooter'

export async function generateMetadata() {
  const t = await getT()
  return {
    title: t('feedbackPage.title'),
    description: t('feedbackPage.description'),
  }
}

export default async function FeedbackPage() {
  const t = await getT()
  return (
    <>
      <header style={{ borderBottom: '1px solid var(--line)', padding: '0 24px', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
          <LocalizedLink href='/' style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            {t('feedbackPage.back')}
          </LocalizedLink>
        </div>
      </header>

      <main style={{ maxWidth: 540, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, margin: '0 0 10px' }}>{t('feedbackPage.heading')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
            {t('feedbackPage.subhead')}
          </p>
        </div>
        <PublicFeedbackForm />
      </main>

      <SiteFooter />
    </>
  )
}
