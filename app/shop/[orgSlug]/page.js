import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import LocalizedLink from '../../../lib/i18n/LocalizedLink'
import { getT } from '../../../lib/i18n/server'

export default async function ShopLandingPage({ params }) {
  const { orgSlug } = await params
  const supabase = getSupabaseAdmin()
  const t = await getT()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (!org) notFound()

  const [brandingRes, reviewsRes] = await Promise.all([
    supabase
      .from('organization_branding')
      .select('logo_url, hero_headline, hero_subheadline')
      .eq('organization_id', org.id)
      .maybeSingle(),
    supabase
      .from('repair_reviews')
      .select('rating', { count: 'exact' })
      .eq('organization_id', org.id),
  ])

  const branding    = brandingRes.data
  const reviewData  = reviewsRes.data  || []
  const reviewCount = reviewsRes.count || 0
  const avgRating   = reviewCount > 0
    ? (reviewData.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1)
    : null
  const showReviews = reviewCount >= 5

  const headline = branding?.hero_headline || t('shopLanding.defaultHeadline', { orgName: org.name })

  const stepTexts = [
    t('shopLanding.stepSubmit'),
    t('shopLanding.stepInspect'),
    t('shopLanding.stepRepair'),
    t('shopLanding.stepShip'),
  ]

  return (
    <main>
      {/* Branded sticky header */}
      <header className='shop-header'>
        {branding?.logo_url ? (
          <img src={branding.logo_url} alt={org.name} />
        ) : (
          <span className='shop-header-name'>{org.name}</span>
        )}
        {branding?.logo_url && <span className='shop-header-name'>{org.name}</span>}
        <div style={{ marginLeft: 'auto' }}>
          <LocalizedLink href={`/shop/${orgSlug}/estimate`} className='button button-primary button-compact'>
            {t('shopLanding.getEstimateButton')}
          </LocalizedLink>
        </div>
      </header>

      {/* Hero */}
      <section className='shop-hero'>
        <h1>{headline}</h1>
        <p>{branding?.hero_subheadline || t('shopLanding.defaultSubheadline')}</p>
        <div className='inline-actions'>
          <LocalizedLink href={`/shop/${orgSlug}/estimate`} className='button button-primary'>
            {t('shopLanding.startFreeEstimate')}
          </LocalizedLink>
          <LocalizedLink href={`/shop/${orgSlug}/book`} className='button button-secondary'>
            {t('shopLanding.bookAppointment')}
          </LocalizedLink>
        </div>
        {showReviews && (
          <div className='shop-reviews-row'>
            {'★'.repeat(Math.round(Number(avgRating)))}{' '}
            {avgRating} · {reviewCount} {reviewCount !== 1 ? t('shopLanding.reviewsPlural') : t('shopLanding.reviewsSingular')}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className='shop-steps'>
        <p className='kicker'>{t('shopLanding.howKicker')}</p>
        <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{t('shopLanding.fourEasySteps')}</h3>
        <div className='steps-grid'>
          {stepTexts.map((s, i) => (
            <div key={i} className='step-tile'>
              <span className='step-number'>{String(i + 1).padStart(2, '0')}</span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5 }}>{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary CTAs */}
      <section className='shop-secondary'>
        <LocalizedLink href={`/shop/${orgSlug}/track`}>{t('shopLanding.secondaryTrack')}</LocalizedLink>
        <LocalizedLink href={`/shop/${orgSlug}/account`}>{t('shopLanding.secondarySignIn')}</LocalizedLink>
      </section>
    </main>
  )
}
