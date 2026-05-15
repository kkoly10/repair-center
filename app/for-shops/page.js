import LocalizedLink from '../../lib/i18n/LocalizedLink'
import { getT } from '../../lib/i18n/server'

const PRICE = 29

export async function generateMetadata() {
  const t = await getT()
  return {
    title: t('forShops.metaTitle'),
    description: t('forShops.metaDescription', { price: PRICE }),
  }
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default async function ForShopsPage() {
  const t = await getT()

  const pains = [
    { icon: '💬', headline: t('forShops.pain1Headline'), body: t('forShops.pain1Body') },
    { icon: '📱', headline: t('forShops.pain2Headline'), body: t('forShops.pain2Body') },
    { icon: '💸', headline: t('forShops.pain3Headline'), body: t('forShops.pain3Body') },
    { icon: '📋', headline: t('forShops.pain4Headline'), body: t('forShops.pain4Body') },
    { icon: '👻', headline: t('forShops.pain5Headline'), body: t('forShops.pain5Body') },
    { icon: '📊', headline: t('forShops.pain6Headline'), body: t('forShops.pain6Body') },
  ]

  const features = [
    { tag: t('forShops.feat1Tag'), headline: t('forShops.feat1Headline'), body: t('forShops.feat1Body'), kills: t('forShops.feat1Kills') },
    { tag: t('forShops.feat2Tag'), headline: t('forShops.feat2Headline'), body: t('forShops.feat2Body'), kills: t('forShops.feat2Kills') },
    { tag: t('forShops.feat3Tag'), headline: t('forShops.feat3Headline'), body: t('forShops.feat3Body'), kills: t('forShops.feat3Kills') },
    { tag: t('forShops.feat4Tag'), headline: t('forShops.feat4Headline'), body: t('forShops.feat4Body'), kills: t('forShops.feat4Kills') },
    { tag: t('forShops.feat5Tag'), headline: t('forShops.feat5Headline'), body: t('forShops.feat5Body'), kills: t('forShops.feat5Kills') },
    { tag: t('forShops.feat6Tag'), headline: t('forShops.feat6Headline'), body: t('forShops.feat6Body'), kills: t('forShops.feat6Kills') },
  ]

  const steps = [
    { n: '01', title: t('forShops.step1Title'), body: t('forShops.step1Body') },
    { n: '02', title: t('forShops.step2Title'), body: t('forShops.step2Body') },
    { n: '03', title: t('forShops.step3Title'), body: t('forShops.step3Body') },
  ]

  const compare = [
    { feature: t('forShops.compareRow1'), us: true, shopr: false, desk: false },
    { feature: t('forShops.compareRow2'), us: true, shopr: false, desk: false },
    { feature: t('forShops.compareRow3'), us: true, shopr: true, desk: true },
    { feature: t('forShops.compareRow4'), us: true, shopr: true, desk: true },
    { feature: t('forShops.compareRow5'), us: true, shopr: true, desk: true },
    { feature: t('forShops.compareRow6'), us: true, shopr: true, desk: true },
    { feature: t('forShops.compareRow7'), us: true, shopr: false, desk: false },
    { feature: t('forShops.compareRow8'), us: t('forShops.compareUsPrice', { price: PRICE }), shopr: t('forShops.compareShoprPrice'), desk: t('forShops.compareDeskPrice') },
    { feature: t('forShops.compareRow9'), us: t('forShops.compareUsTrial'), shopr: t('forShops.compareShoprTrial'), desk: t('forShops.compareDeskTrial') },
  ]

  const faqs = [
    { q: t('forShops.faq1Q'), a: t('forShops.faq1A') },
    { q: t('forShops.faq2Q'), a: t('forShops.faq2A', { price: PRICE }) },
    { q: t('forShops.faq3Q'), a: t('forShops.faq3A', { price: PRICE }) },
    { q: t('forShops.faq4Q'), a: t('forShops.faq4A') },
    { q: t('forShops.faq5Q'), a: t('forShops.faq5A') },
    { q: t('forShops.faq6Q'), a: t('forShops.faq6A') },
    { q: t('forShops.faq7Q'), a: t('forShops.faq7A') },
  ]

  const pricingFeatures = [
    t('forShops.pricingFeature1'),
    t('forShops.pricingFeature2'),
    t('forShops.pricingFeature3'),
    t('forShops.pricingFeature4'),
    t('forShops.pricingFeature5'),
    t('forShops.pricingFeature6'),
    t('forShops.pricingFeature7'),
    t('forShops.pricingFeature8'),
    t('forShops.pricingFeature9'),
    t('forShops.pricingFeature10'),
  ]

  const diffRows = [
    { label: t('forShops.diffRow1'), mail: true, walkin: true },
    { label: t('forShops.diffRow2'), mail: true, walkin: true },
    { label: t('forShops.diffRow3'), mail: true, walkin: true },
    { label: t('forShops.diffRow4'), mail: false, walkin: true },
    { label: t('forShops.diffRow5'), mail: true, walkin: true },
    { label: t('forShops.diffRow6'), mail: true, walkin: true },
  ]

  const dashboardPreviewRows = [
    { label: t('forShops.dashboardPreviewQuotes'), value: '3', color: '#3b82f6' },
    { label: t('forShops.dashboardPreviewInRepair'), value: '8', color: '#f59e0b' },
    { label: t('forShops.dashboardPreviewAwaiting'), value: '2', color: '#8b5cf6' },
    { label: t('forShops.dashboardPreviewReady'), value: '4', color: '#10b981' },
  ]

  return (
    <main>

      {/* Hero */}
      <section className="hero-full">
        <div className="site-shell hero-full-grid">
          <div className="hero-full-copy">
            <div className="hero-full-eyebrow">{t('forShops.heroKicker')}</div>
            <h1>{t('forShops.heroTitle')}</h1>
            <p>{t('forShops.heroBody')}</p>
            <div className="hero-actions-row">
              <LocalizedLink href="/signup" className="button button-primary">
                {t('forShops.heroCtaPrimary')}
              </LocalizedLink>
              <LocalizedLink href="#how-it-works" className="button button-outline">
                {t('forShops.heroCtaSecondary')}
              </LocalizedLink>
            </div>
            <p style={{ marginTop: 14, fontSize: '0.85rem', color: 'var(--muted)' }}>
              {t('forShops.heroFinePrint', { price: PRICE })}
            </p>
          </div>

          <div className="hero-full-devices" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
                <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                  your-shop.repaircenter.app/admin
                </span>
              </div>
              {dashboardPreviewRows.map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.88rem' }}>{label}</span>
                  <span style={{ fontWeight: 700, color, fontSize: '1.1rem' }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>{t('forShops.dashboardPreviewRevenue')}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111' }}>$4,280</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="section section-dark-bg">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker kicker-dark-section">{t('forShops.painsKicker')}</div>
              <h2 className="section-title section-title-light">{t('forShops.painsTitle')}</h2>
            </div>
          </div>
          <div className="grid-3">
            {pains.map(({ icon, headline, body }) => (
              <div key={headline} className="repair-card repair-card-dark">
                <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>{headline}</h3>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">{t('forShops.featuresKicker')}</div>
              <h2 className="section-title">{t('forShops.featuresTitle')}</h2>
              <p className="section-copy muted" style={{ marginTop: 10 }}>
                {t('forShops.featuresBody')}
              </p>
            </div>
          </div>
          <div className="grid-3">
            {features.map(({ tag, headline, body, kills }) => (
              <div key={headline} className="feature-card">
                <div className="mini-chip" style={{ marginBottom: 12 }}>{tag}</div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{headline}</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 14 }}>{body}</p>
                <p style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, margin: 0 }}>{kills}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mail-in differentiator */}
      <section className="section" style={{ background: '#f0f9ff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="site-shell">
          <div className="grid-2" style={{ alignItems: 'center', gap: 48 }}>
            <div>
              <div className="kicker">{t('forShops.diffKicker')}</div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>{t('forShops.diffTitle')}</h2>
              <p className="muted" style={{ fontSize: '1rem', lineHeight: 1.7, marginBottom: 20 }}>
                {t('forShops.diffBody1')}
              </p>
              <p className="muted" style={{ fontSize: '1rem', lineHeight: 1.7, marginBottom: 24 }}>
                {t('forShops.diffBody2')}
              </p>
              <LocalizedLink href="/signup" className="button button-primary">
                {t('forShops.diffCta')}
              </LocalizedLink>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 0, paddingRight: 0, marginBottom: 4 }}>
                <span style={{ width: 80, textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>{t('forShops.diffColMail')}</span>
                <span style={{ width: 80, textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>{t('forShops.diffColInStore')}</span>
              </div>
              {diffRows.map(({ label, mail, walkin }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'white', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontSize: '0.9rem' }}>{label}</span>
                  <span style={{ width: 80, textAlign: 'center' }}>{mail ? <CheckIcon /> : <XIcon />}</span>
                  <span style={{ width: 80, textAlign: 'center' }}>{walkin ? <CheckIcon /> : <XIcon />}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how-it-works">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">{t('forShops.setupKicker')}</div>
              <h2 className="section-title">{t('forShops.setupTitle')}</h2>
            </div>
          </div>
          <div className="steps-grid">
            {steps.map(({ n, title, body }) => (
              <div key={n} className="step-card">
                <div className="step-number">{n}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section section-dark-bg" id="pricing">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker kicker-dark-section">{t('forShops.pricingKicker')}</div>
              <h2 className="section-title section-title-light">{t('forShops.pricingTitle')}</h2>
              <p style={{ marginTop: 10, color: '#94a3b8' }}>{t('forShops.pricingBody')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '40px 48px',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{t('forShops.pricingPlanLabel')}</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                ${PRICE}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>{t('forShops.pricingPerMonth')}</span>
              </div>
              <div style={{ color: '#94a3b8', margin: '12px 0 28px', fontSize: '0.9rem' }}>
                {t('forShops.pricingFinePrint')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
                {pricingFeatures.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e2e8f0', fontSize: '0.9rem' }}>
                    <CheckIcon />
                    {item}
                  </div>
                ))}
              </div>
              <LocalizedLink href="/signup" className="button button-primary" style={{ display: 'block', textAlign: 'center' }}>
                {t('forShops.pricingCta')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">{t('forShops.compareKicker')}</div>
              <h2 className="section-title">{t('forShops.compareTitle')}</h2>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, width: '40%' }}>{t('forShops.compareColFeature')}</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--blue)', background: '#f0f9ff' }}>{t('forShops.compareColUs')}</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--muted)' }}>{t('forShops.compareColShopr')}</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--muted)' }}>{t('forShops.compareColDesk')}</th>
                </tr>
              </thead>
              <tbody>
                {compare.map(({ feature, us, shopr, desk }) => (
                  <tr key={feature} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{feature}</td>
                    <td style={{ textAlign: 'center', padding: '12px 16px', background: '#f0f9ff', fontWeight: 600, color: 'var(--blue)' }}>
                      {typeof us === 'boolean' ? (us ? <CheckIcon /> : <XIcon />) : us}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                      {typeof shopr === 'boolean' ? (shopr ? <CheckIcon /> : <XIcon />) : shopr}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                      {typeof desk === 'boolean' ? (desk ? <CheckIcon /> : <XIcon />) : desk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: '0.8rem' }}>
            {t('forShops.compareFootnote')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">{t('forShops.faqKicker')}</div>
              <h2 className="section-title">{t('forShops.faqTitle')}</h2>
            </div>
          </div>
          <div className="grid-2">
            {faqs.map(({ q, a }) => (
              <div key={q} className="faq-card">
                <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>{q}</h3>
                <p style={{ margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section">
        <div className="site-shell">
          <div className="cta-strip">
            <div>
              <div className="kicker">{t('forShops.ctaKicker')}</div>
              <h3 className="card-title">{t('forShops.ctaTitle')}</h3>
              <p className="muted">{t('forShops.ctaBody', { price: PRICE })}</p>
            </div>
            <div className="inline-actions">
              <LocalizedLink href="/signup" className="button button-primary">
                {t('forShops.ctaPrimary')}
              </LocalizedLink>
              <LocalizedLink href="/contact" className="button button-secondary">
                {t('forShops.ctaSecondary')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
