import LocalizedLink from '../../lib/i18n/LocalizedLink'
import { getT } from '../../lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return {
    title: t('contact.metaTitle'),
    description: t('contact.metaDescription'),
  }
}

export default async function ContactPage() {
  const t = await getT()
  return (
    <main className="page-hero">
      <div className="site-shell page-stack">
        <div className="info-card">
          <div className="kicker">{t('contact.kicker')}</div>
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.body')}</p>
        </div>

        <div className="grid-2">
          <div className="feature-card">
            <div className="mini-chip" style={{ marginBottom: 12 }}>{t('contact.generalChip')}</div>
            <h3>{t('contact.generalTitle')}</h3>
            <p>{t('contact.generalBody')}</p>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@repaircenter.app'}`}
              className="button button-primary"
              style={{ marginTop: 16, display: 'inline-block' }}
            >
              {t('contact.emailUs')}
            </a>
          </div>

          <div className="feature-card">
            <div className="mini-chip" style={{ marginBottom: 12 }}>{t('contact.salesChip')}</div>
            <h3>{t('contact.salesTitle')}</h3>
            <p>{t('contact.salesBody')}</p>
            <LocalizedLink href="/signup" className="button button-secondary" style={{ marginTop: 16, display: 'inline-block' }}>
              {t('contact.salesCta')}
            </LocalizedLink>
          </div>
        </div>

        <div className="faq-card">
          <h3>{t('contact.faqTitle')}</h3>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li>{t('contact.faqItem1')}</li>
            <li>{t('contact.faqItem2')}</li>
            <li>{t('contact.faqItem3')}</li>
            <li>{t('contact.faqItem4')}</li>
          </ul>
          <div style={{ marginTop: 16 }}>
            <LocalizedLink href="/for-shops#faq" className="button button-ghost button-compact">
              {t('contact.seeAllFaqs')}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </main>
  )
}
