import LocalizedLink from '../../lib/i18n/LocalizedLink'
import { getT } from '../../lib/i18n/server'

const howItWorksImage =
  'https://images.unsplash.com/photo-1750744788280-aa47aba79a57?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=2200'

export default async function HowItWorksPage() {
  const t = await getT()

  const steps = [
    { title: t('howItWorks.process1Title'), text: t('howItWorks.process1Text') },
    { title: t('howItWorks.process2Title'), text: t('howItWorks.process2Text') },
    { title: t('howItWorks.process3Title'), text: t('howItWorks.process3Text') },
    { title: t('howItWorks.process4Title'), text: t('howItWorks.process4Text') },
    { title: t('howItWorks.process5Title'), text: t('howItWorks.process5Text') },
    { title: t('howItWorks.process6Title'), text: t('howItWorks.process6Text') },
  ]

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <section
          className='quote-card'
          style={{
            overflow: 'hidden',
            gridTemplateColumns: '1.05fr 0.95fr',
            alignItems: 'stretch',
          }}
        >
          <div style={{ padding: 28, display: 'grid', alignContent: 'center', gap: 16 }}>
            <div className='kicker'>{t('howItWorks.kicker')}</div>
            <h1 style={{ margin: 0 }}>{t('howItWorks.heroTitle')}</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 56 + 'ch' }}>
              {t('howItWorks.heroDescription')}
            </p>

            <div className='inline-actions' style={{ marginBottom: 0 }}>
              <LocalizedLink href='/estimate' className='button button-primary'>
                {t('howItWorks.startFreeEstimate')}
              </LocalizedLink>
              <LocalizedLink href='/track' className='button button-secondary'>
                {t('howItWorks.trackARepair')}
              </LocalizedLink>
            </div>
          </div>

          <div style={{ minHeight: 360, position: 'relative' }}>
            <img
              src={howItWorksImage}
              alt={t('howItWorks.heroAlt')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </section>

        <div className='grid-3'>
          {steps.map((step, index) => (
            <div key={step.title} className='feature-card'>
              <span className='price-chip'>{t('howItWorks.stepLabel', { n: index + 1 })}</span>
              <h3 style={{ marginTop: 14 }}>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <section className='policy-card'>
          <div className='kicker'>{t('howItWorks.expectKicker')}</div>
          <h3>{t('howItWorks.expectHeading')}</h3>
          <p>
            {t('howItWorks.expectBody')}
          </p>
        </section>

        <section className='cta-strip'>
          <div>
            <div className='kicker'>{t('howItWorks.readyKicker')}</div>
            <h3 className='card-title'>{t('howItWorks.readyHeading')}</h3>
            <p className='muted'>{t('howItWorks.readyBody')}</p>
          </div>
          <LocalizedLink href='/estimate' className='button button-primary'>
            {t('howItWorks.openEstimate')}
          </LocalizedLink>
        </section>
      </div>
    </main>
  )
}
