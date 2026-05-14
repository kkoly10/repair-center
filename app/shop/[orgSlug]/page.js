import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

export default async function ShopLandingPage({ params }) {
  const { orgSlug } = await params
  const supabase = getSupabaseAdmin()

  const [{ data: org }, ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', orgSlug)
      .eq('status', 'active')
      .maybeSingle(),
  ])

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

  const headline = branding?.hero_headline || `${org.name} repairs phones, tablets & laptops.`

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
          <Link href={`/shop/${orgSlug}/estimate`} className='button button-primary button-compact'>
            Get Estimate
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className='shop-hero'>
        <h1>{headline}</h1>
        <p>{branding?.hero_subheadline || 'Get a free estimate in under 60 seconds.'}</p>
        <div className='inline-actions'>
          <Link href={`/shop/${orgSlug}/estimate`} className='button button-primary'>
            Start Free Estimate
          </Link>
          <Link href={`/shop/${orgSlug}/book`} className='button button-secondary'>
            Book Appointment
          </Link>
        </div>
        {showReviews && (
          <div className='shop-reviews-row'>
            {'★'.repeat(Math.round(Number(avgRating)))}{' '}
            {avgRating} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className='shop-steps'>
        <p className='kicker'>How it works</p>
        <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 700 }}>Four easy steps</h3>
        <div className='steps-grid'>
          {[
            'Submit your device',
            'We inspect & estimate',
            'We repair it',
            'We ship it back',
          ].map((s, i) => (
            <div key={i} className='step-tile'>
              <span className='step-number'>{String(i + 1).padStart(2, '0')}</span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5 }}>{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary CTAs */}
      <section className='shop-secondary'>
        <Link href={`/shop/${orgSlug}/track`}>Already submitted? Track your repair →</Link>
        <Link href={`/shop/${orgSlug}/account`}>Returning customer? Sign in →</Link>
      </section>
    </main>
  )
}
