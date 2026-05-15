import LocalizedLink from '../../lib/i18n/LocalizedLink'
import { getT } from '../../lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('faq.metaTitle') }
}

export default async function FaqPage() {
  const t = await getT()

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
    { question: t('faq.q6'), answer: t('faq.a6') },
    { question: t('faq.q7'), answer: t('faq.a7') },
    { question: t('faq.q8'), answer: t('faq.a8') },
  ]

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <section
          className='quote-card'
          style={{
            overflow: 'hidden',
            gridTemplateColumns: '1fr 1fr',
            alignItems: 'stretch',
          }}
        >
          <div style={{ padding: 28, display: 'grid', alignContent: 'center', gap: 16 }}>
            <div className='kicker'>{t('faq.kicker')}</div>
            <h1 style={{ margin: 0 }}>{t('faq.heroTitle')}</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 58 + 'ch' }}>{t('faq.heroBody')}</p>

            <div className='inline-actions' style={{ marginBottom: 0 }}>
              <LocalizedLink href='/estimate' className='button button-primary'>
                {t('faq.ctaStart')}
              </LocalizedLink>
              <LocalizedLink href='/how-it-works' className='button button-secondary'>
                {t('faq.ctaHowItWorks')}
              </LocalizedLink>
            </div>
          </div>

          <div style={{ minHeight: 340, position: 'relative' }}>
            <img
              src='/images/laptop-open.jpg'
              alt={t('faq.imageAlt')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </section>

        <div className='grid-2'>
          {faqs.map((faq) => (
            <div key={faq.question} className='faq-card'>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>

        <section className='policy-card'>
          <div className='kicker'>{t('faq.stillNotSureKicker')}</div>
          <h3>{t('faq.stillNotSureTitle')}</h3>
          <p>{t('faq.stillNotSureBody')}</p>
        </section>
      </div>
    </main>
  )
}
