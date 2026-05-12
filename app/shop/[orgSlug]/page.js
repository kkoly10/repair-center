import Link from 'next/link'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

export default async function ShopLandingPage({ params }) {
  const { orgSlug } = await params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (!org) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='info-card'>
            <h1>Shop not found</h1>
            <p>This shop link is invalid or inactive.</p>
          </div>
        </div>
      </main>
    )
  }

  const { data: branding } = await supabase
    .from('organization_branding')
    .select('logo_url, hero_headline, hero_subheadline')
    .eq('organization_id', org.id)
    .maybeSingle()

  const headline = branding?.hero_headline || `${org.name} — Device Repair`
  const subheadline =
    branding?.hero_subheadline ||
    'Mail in your device for a free estimate. No account required.'

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={org.name}
              style={{ height: 48, marginBottom: 16, objectFit: 'contain' }}
            />
          ) : null}
          <div className='kicker'>{org.name}</div>
          <h1>{headline}</h1>
          <p>{subheadline}</p>
        </div>

        <div className='grid-2'>
          <div className='policy-card'>
            <div className='kicker'>Get started</div>
            <h3>Request a free estimate</h3>
            <p>
              Select your device, describe the problem, and upload a few photos. We&apos;ll review
              your request and send a detailed estimate within one business day.
            </p>
            <div className='inline-actions'>
              <Link href={`/shop/${orgSlug}/estimate`} className='button button-primary'>
                Start Free Estimate
              </Link>
            </div>
          </div>

          <div className='policy-card'>
            <div className='kicker'>Already submitted?</div>
            <h3>Track your repair</h3>
            <p>
              Use your Quote ID or Order Number with the email you provided to check on your
              repair status, view estimates, and send messages to the team.
            </p>
            <div className='inline-actions'>
              <Link href={`/shop/${orgSlug}/track`} className='button button-secondary'>
                Track a Repair
              </Link>
            </div>
          </div>
        </div>

        <div className='policy-card'>
          <div className='kicker'>How it works</div>
          <h3>Repair in four steps</h3>
          <div className='preview-meta' style={{ marginTop: 18 }}>
            <div className='preview-meta-row'>
              <span>1 — Submit</span>
              <span>Fill out the estimate form and upload photos of your device.</span>
            </div>
            <div className='preview-meta-row'>
              <span>2 — Review</span>
              <span>We assess your request and send a detailed estimate by email.</span>
            </div>
            <div className='preview-meta-row'>
              <span>3 — Approve &amp; ship</span>
              <span>Approve the estimate, then mail your device to us.</span>
            </div>
            <div className='preview-meta-row'>
              <span>4 — Repaired &amp; returned</span>
              <span>We repair the device and ship it back with tracking.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
