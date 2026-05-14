import Link from 'next/link'

const PRICE = 29

const pains = [
  {
    icon: '💬',
    headline: 'Customers DM you for a quote. You reply two days later.',
    body: 'They already went somewhere else. Your repair skills are great. Your intake process is costing you jobs.',
  },
  {
    icon: '📱',
    headline: '"Hey, where\'s my phone?" — answered 11 times this week.',
    body: "Each reply interrupts a repair in progress. You're spending technician time doing customer service that should be automated.",
  },
  {
    icon: '💸',
    headline: 'Venmo. Cash. "I\'ll pay you when I pick it up."',
    body: "You're collecting payment however the customer prefers, with no deposit to hold the job, and no clear record of what was paid and when.",
  },
  {
    icon: '📋',
    headline: 'Your tracking system is a spreadsheet. Or your memory.',
    body: "When a job falls through the cracks, you find out because the customer shows up angry — not because your system caught it first.",
  },
  {
    icon: '👻',
    headline: "You sent an estimate. They ghosted. Three weeks later they're furious.",
    body: "No follow-up. No reminder. No audit trail. Just a customer who thinks you lost their device and a repair you never started.",
  },
  {
    icon: '📊',
    headline: 'You have no idea which repairs are actually profitable.',
    body: "Screen replacements feel busy but margins are thin. Motherboard jobs pay well but take all day. You're guessing instead of managing.",
  },
]

const features = [
  {
    tag: 'Front door',
    headline: "A branded shop page that's actually yours",
    body: 'Your shop gets its own URL — /shop/your-brand — with your colors, your name, and your estimate form. Not a Facebook page. Not a Google Form. A real shop.',
    kills: 'Kills: "My shop has no professional presence"',
  },
  {
    tag: 'Intake',
    headline: "Quotes that don't live in your DMs",
    body: 'Customers submit a repair request with photos right from your page. You review, approve, and send an estimate in one click. The whole thread is logged.',
    kills: 'Kills: "I\'m quoting via text message"',
  },
  {
    tag: 'Tracking',
    headline: '"Where\'s my device?" — answered automatically.',
    body: 'Every customer gets a live tracking link. They check status, read your messages, and approve estimates — without calling or texting you.',
    kills: 'Kills: "I answer the same question 10 times a day"',
  },
  {
    tag: 'Payments',
    headline: 'Deposits up front. Final balance automated.',
    body: 'Collect a deposit before you touch the device. When the repair is done, send the final balance request in one click. Stripe handles the rest.',
    kills: 'Kills: "I collect payment however the customer wants"',
  },
  {
    tag: 'Operations',
    headline: "A dashboard that shows you what's actually happening",
    body: 'Repair queue, technician assignments, priority flags, SLA tracking, parts inventory, and analytics — all in one place. Know which jobs are overdue before your customer does.',
    kills: 'Kills: "My tracking system is a spreadsheet"',
  },
  {
    tag: 'In-store',
    headline: 'Appointment booking for walk-ins too',
    body: "Customers can book a drop-off appointment from your shop page. You see it in your dashboard alongside your mail-in queue. One system for both.",
    kills: 'Kills: "Walk-in customers have no way to book ahead"',
  },
]

const steps = [
  {
    n: '01',
    title: 'Create your shop',
    body: 'Sign up, name your shop, add your branding. Takes about 5 minutes. No technical setup required.',
  },
  {
    n: '02',
    title: 'Share your link',
    body: "Send customers to /shop/your-brand. Put it in your bio, on a receipt, in a text reply. It's your shop's front door.",
  },
  {
    n: '03',
    title: 'Manage everything from your dashboard',
    body: 'Quotes, repairs, payments, messages, parts, and analytics — one admin panel, always up to date.',
  },
]

const compare = [
  { feature: 'Mail-in workflow at the center', us: true, shopr: false, desk: false },
  { feature: 'Branded shop page per tenant', us: true, shopr: false, desk: false },
  { feature: 'Customer self-serve tracking', us: true, shopr: true, desk: true },
  { feature: 'Appointment booking', us: true, shopr: true, desk: true },
  { feature: 'Parts inventory', us: true, shopr: true, desk: true },
  { feature: 'Analytics dashboard', us: true, shopr: true, desk: true },
  { feature: 'Tamper-proof customer links', us: true, shopr: false, desk: false },
  { feature: 'Starting price', us: `$${PRICE}/mo (Founder Beta)`, shopr: '$99/mo', desk: '$49/mo' },
  { feature: 'Free trial', us: '14 days', shopr: 'No card req.', desk: 'Limited' },
]

const faqs = [
  {
    q: 'Do I need to be a mail-in shop to use this?',
    a: "No. RepairCenter is built with mail-in workflows at the center, but the platform handles walk-in repairs, drop-offs, and appointment bookings too. Most shops use both.",
  },
  {
    q: 'What happens after the free trial?',
    a: `If you have not added a payment method, your trial ends and access is paused — you will not be charged. If you have added a card, your subscription continues at the current Founder Beta rate of $${PRICE}/month. You can cancel anytime from the billing page; there is no contract.`,
  },
  {
    q: 'Will the price stay $29/month forever?',
    a: `The Founder Beta plan is $${PRICE}/month while we are in beta and includes every feature in the product today. When we launch public tiers (Starter / Growth / Pro / Advanced) features will be allocated across tiers and prices will change. Founder Beta accounts may be eligible for grandfathered pricing at our discretion — we will give you reasonable notice before any change.`,
  },
  {
    q: 'Can I bring my existing customers over?',
    a: "New accounts start fresh — RepairCenter builds your history as jobs come in. Your pricing rules are set up during onboarding. If you need to migrate data from another platform, get in touch and we will help.",
  },
  {
    q: 'Do my customers need to create accounts?',
    a: "No. Customers can access their repair status via a secure link sent to their email. They can also optionally sign in with a magic link to see all their repairs at your shop in one place.",
  },
  {
    q: 'Do I need Stripe to accept payments?',
    a: "Only if you want to accept online card payments through the platform. You can set your shop to manual payment mode and collect cash, Zelle, Cash App, or Square yourself — the platform still handles everything else. Your shop is the merchant of record for repair payments either way.",
  },
  {
    q: 'Who is responsible for the actual repair?',
    a: "Your shop is. RepairCenter is software — we provide the intake form, the tracking page, the payment tools, and the admin dashboard. The repair itself, the pricing, the warranty, the refund policy, and the shipping instructions are all controlled by your shop.",
  },
]

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

export const metadata = {
  title: 'RepairCenter for Shops — Run Your Repair Business Online',
  description: `Give your repair shop a professional front door. Branded estimate forms, customer tracking, automated payments, and a full admin dashboard. Built with mail-in workflows at the center; designed for shops that handle both mail-in and in-store repairs. Founder Beta plan at $${PRICE}/month with a 14-day free trial.`,
}

export default function ForShopsPage() {
  return (
    <main>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-full">
        <div className="site-shell hero-full-grid">
          <div className="hero-full-copy">
            <div className="hero-full-eyebrow">Repair shop software</div>
            <h1>Stop managing repairs from your inbox.</h1>
            <p>
              RepairCenter gives your shop a professional front door — branded estimate forms,
              customer tracking, automated payments, and a full admin dashboard.
              Built for mail-in. Works in-store too.
            </p>
            <div className="hero-actions-row">
              <Link href="/signup" className="button button-primary">
                Start your free 14-day trial
              </Link>
              <Link href="#how-it-works" className="button button-outline">
                See how it works
              </Link>
            </div>
            <p style={{ marginTop: 14, fontSize: '0.85rem', color: 'var(--muted)' }}>
              14-day trial &middot; No credit card required during the trial &middot; Cancel anytime &middot; Founder Beta at ${PRICE}/month after trial
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
              {[
                { label: 'New quote requests', value: '3', color: '#3b82f6' },
                { label: 'In repair', value: '8', color: '#f59e0b' },
                { label: 'Awaiting payment', value: '2', color: '#8b5cf6' },
                { label: 'Ready to ship', value: '4', color: '#10b981' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.88rem' }}>{label}</span>
                  <span style={{ fontWeight: 700, color, fontSize: '1.1rem' }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>Revenue this month</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111' }}>$4,280</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain points ──────────────────────────────────────── */}
      <section className="section section-dark-bg">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker kicker-dark-section">Sound familiar?</div>
              <h2 className="section-title section-title-light">
                Running a repair shop should not feel like this.
              </h2>
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

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">The fix</div>
              <h2 className="section-title">One platform that handles all of it.</h2>
              <p className="section-copy muted" style={{ marginTop: 10 }}>
                Every feature is a direct answer to a real problem. Nothing bloated. Nothing you will not use.
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

      {/* ── Mail-in differentiator ───────────────────────────── */}
      <section className="section" style={{ background: '#f0f9ff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="site-shell">
          <div className="grid-2" style={{ alignItems: 'center', gap: 48 }}>
            <div>
              <div className="kicker">The differentiator</div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>
                Built with mail-in workflows at the center.
              </h2>
              <p className="muted" style={{ fontSize: '1rem', lineHeight: 1.7, marginBottom: 20 }}>
                Most shop-management platforms were designed around a front counter and a cash
                drawer. Mail-in tends to be a bolt-on.
              </p>
              <p className="muted" style={{ fontSize: '1rem', lineHeight: 1.7, marginBottom: 24 }}>
                We built mail-in first — the estimate flow, the tracking link, the deposit collection,
                the shipping confirmation — and then designed in-store on top. The result is a
                platform that fits how remote repair works without stripping out what walk-in shops
                need.
              </p>
              <Link href="/signup" className="button button-primary">
                Start your free trial
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 0, paddingRight: 0, marginBottom: 4 }}>
                <span style={{ width: 80, textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Mail-in</span>
                <span style={{ width: 80, textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>In-store</span>
              </div>
              {[
                { label: 'Estimate form + photo intake', mail: true, walkin: true },
                { label: 'Customer self-serve tracking page', mail: true, walkin: true },
                { label: 'Automated deposit collection', mail: true, walkin: true },
                { label: 'Walk-in appointment booking', mail: false, walkin: true },
                { label: 'Branded per-shop public URL', mail: true, walkin: true },
                { label: 'Admin repair queue + SLA flags', mail: true, walkin: true },
              ].map(({ label, mail, walkin }) => (
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

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">Setup</div>
              <h2 className="section-title">Your shop is live in 10 minutes.</h2>
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

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="section section-dark-bg" id="pricing">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker kicker-dark-section">Pricing</div>
              <h2 className="section-title section-title-light">Founder Beta Plan — everything included during beta.</h2>
              <p style={{ marginTop: 10, color: '#94a3b8' }}>
                One transparent price while we are in beta. Public tiers (Starter, Growth, Pro, Advanced) will follow when the product is out of beta. Founder accounts may receive grandfathered terms at our discretion.
              </p>
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
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Founder Beta Plan</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                ${PRICE}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>/month</span>
              </div>
              <div style={{ color: '#94a3b8', margin: '12px 0 28px', fontSize: '0.9rem' }}>
                14-day free trial &middot; No credit card required during trial &middot; Cancel anytime
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
                {[
                  'Branded shop page + estimate form',
                  'Customer tracking + messaging',
                  'Admin repair queue + SLA dashboard',
                  'Parts inventory management',
                  'Analytics + staff performance reports',
                  'Appointment booking',
                  'Invoice + receipt generation',
                  'Automated customer notifications',
                  'Multi-technician support',
                  'Review collection + follow-up emails',
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e2e8f0', fontSize: '0.9rem' }}>
                    <CheckIcon />
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/signup" className="button button-primary" style={{ display: 'block', textAlign: 'center' }}>
                Start your free 14-day trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────── */}
      <section className="section">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">How we compare</div>
              <h2 className="section-title">Built different. Priced fairly.</h2>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, width: '40%' }}>Feature</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--blue)', background: '#f0f9ff' }}>RepairCenter</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--muted)' }}>RepairShopr</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--muted)' }}>RepairDesk</th>
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
            Comparison based on publicly available pricing and feature descriptions as of May 2026.
            Sourced from each vendor&apos;s public website at that date. Features and prices change —
            check each vendor&apos;s site for current information.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <div className="kicker">FAQ</div>
              <h2 className="section-title">Common questions.</h2>
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

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="section">
        <div className="site-shell">
          <div className="cta-strip">
            <div>
              <div className="kicker">Ready?</div>
              <h3 className="card-title">Your shop could be live in 10 minutes.</h3>
              <p className="muted">
                No demo call. No sales rep. Sign up, configure your shop, and share your link.
                Free for 14 days, then Founder Beta at ${PRICE}/month.
              </p>
            </div>
            <div className="inline-actions">
              <Link href="/signup" className="button button-primary">
                Start free trial
              </Link>
              <Link href="/contact" className="button button-secondary">
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
