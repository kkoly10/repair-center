import Link from 'next/link'
import StatusTracker from '../components/StatusTracker'
import { REPAIR_STATUS_STEPS, REPAIR_CATALOG } from '../lib/repairCatalog'

const deviceCards = [
  {
    title: 'Phones',
    text: 'Cracked screens, battery replacements, charging issues, cameras, and software resets for supported models.',
  },
  {
    title: 'Laptops',
    text: 'Battery service, keyboard replacements, SSD upgrades, tune-ups, software installs, and deeper inspection for select issues.',
  },
  {
    title: 'Tablets',
    text: 'Screen, battery, charging port, and software service for iPads and other supported tablet models.',
  },
  {
    title: 'Select Desktop Support',
    text: 'Handled case by case through estimate review so shipping and repair scope stay practical.',
  },
]

const commonRepairs = [
  'Screen replacement',
  'Battery replacement',
  'Charging port repair',
  'Keyboard and input repair',
  'SSD install and setup',
  'Software restore and cleanup',
]

const testimonials = [
  {
    title: 'Made for trust',
    text: 'The site is positioned around photo estimates, tracked status, and approval before repair so customers never feel like they are mailing a device into a black box.',
  },
  {
    title: 'Built for part-time operations',
    text: 'The flow supports controlled intake, fixed weekly capacity, and a clean handoff from estimate to inspection to return shipping.',
  },
  {
    title: 'Ready for catalog-based pricing',
    text: 'The current starter build already includes a model-based pricing seed so the site can evolve into a real quote engine.',
  },
]

const highlightedRepairs = REPAIR_CATALOG.slice(0, 6).map((entry) => ({
  model: entry.model,
  brand: entry.brand,
  category: entry.category,
  preview: entry.repairs[0],
}))

export default function HomePage() {
  return (
    <main>
      <section className='hero'>
        <div className='site-shell hero-grid'>
          <div className='hero-copy'>
            <div className='eyebrow'>Premium mail-in repair for phones, tablets, and laptops</div>
            <h1>Professional tech repair, delivered to your door.</h1>
            <p>
              Upload photos, get a free estimate, mail in your device only if you approve,
              and track the whole process with confidence.
            </p>

            <div className='hero-actions-row'>
              <Link href='/estimate' className='button button-primary'>
                Get Free Estimate
              </Link>
              <Link href='/how-it-works' className='button button-secondary'>
                See How It Works
              </Link>
            </div>

            <div className='trust-row'>
              <span className='badge'>No account required</span>
              <span className='badge'>Human-reviewed quotes</span>
              <span className='badge'>Secure return shipping</span>
              <span className='badge'>Model-based pricing</span>
            </div>
          </div>

          <div className='hero-side'>
            <div className='hero-card metric-grid'>
              <div className='metric'>
                <strong>Free</strong>
                <span>photo estimate before shipping</span>
              </div>
              <div className='metric'>
                <strong>7-step</strong>
                <span>tracked workflow from intake to return</span>
              </div>
              <div className='metric'>
                <strong>90-day</strong>
                <span>limited warranty on supported repairs</span>
              </div>
              <div className='metric'>
                <strong>Catalog</strong>
                <span>model-by-model pricing foundation</span>
              </div>
            </div>

            <div className='panel'>
              <div className='kicker'>Tracking preview</div>
              <h3>Quote ID · RC-10284</h3>
              <p>Every approved repair moves through a clear status flow instead of vague email back-and-forth.</p>
              <div style={{ marginTop: 18 }}>
                <StatusTracker steps={REPAIR_STATUS_STEPS} currentStep={2} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>How it works</div>
              <h2 className='section-title'>A clean, trust-first mail-in workflow</h2>
            </div>
            <p className='section-copy'>
              The website is structured around estimate first, approval before shipping, human-reviewed inspection,
              and clear repair tracking after intake.
            </p>
          </div>

          <div className='steps-grid'>
            {[
              ['01', 'Upload photos', 'Start with a free estimate and basic device details.'],
              ['02', 'Get a preliminary quote', 'Receive a model-aware estimate range and next-step guidance.'],
              ['03', 'Approve mail-in', 'Ship only if you want to proceed with the repair path.'],
              ['04', 'Track repair progress', 'See inspection, approval, repair, and return status in one place.'],
            ].map(([number, title, text]) => (
              <div key={number} className='step-card'>
                <div className='step-number'>{number}</div>
                <h3>{title}</h3>
                <p className='muted'>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Supported devices</div>
              <h2 className='section-title'>Focused on the devices people rely on most</h2>
            </div>
            <p className='section-copy'>
              Launching with a narrower service scope keeps the business practical, profitable, and easier to trust.
            </p>
          </div>

          <div className='grid-4'>
            {deviceCards.map((card) => (
              <div key={card.title} className='device-card'>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Common repairs</div>
              <h2 className='section-title'>The jobs that fit a controlled mail-in model</h2>
            </div>
            <p className='section-copy'>
              The strongest launch category is predictable work with common parts and repeatable labor time.
            </p>
          </div>

          <div className='grid-3'>
            {commonRepairs.map((repair) => (
              <div key={repair} className='repair-card'>
                <span className='price-chip'>Popular service</span>
                <h3 style={{ marginTop: 14 }}>{repair}</h3>
                <p>
                  Designed to be quoted through the estimate flow first, then confirmed after inspection if needed.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Starter pricing preview</div>
              <h2 className='section-title'>Seeded with model-based catalog logic</h2>
            </div>
            <p className='section-copy'>
              This first build includes a starter catalog so customers can choose a category, brand, model, and repair type.
            </p>
          </div>

          <div className='grid-3'>
            {highlightedRepairs.map((item) => (
              <div key={`${item.model}-${item.preview.key}`} className='feature-card'>
                <span className='mini-chip'>{item.brand} · {item.category}</span>
                <h3 style={{ marginTop: 14 }}>{item.model}</h3>
                <p>{item.preview.label}</p>
                <div style={{ marginTop: 16 }} className='price-chip'>
                  {item.preview.mode === 'fixed'
                    ? `$${item.preview.price}`
                    : item.preview.mode === 'range'
                    ? `$${item.preview.min}–$${item.preview.max}`
                    : 'Inspection required'}
                </div>
              </div>
            ))}
          </div>

          <div className='cta-strip'>
            <div>
              <div className='kicker'>Ready to build out the full flow</div>
              <h3 className='card-title'>Start with the estimate page and track page now.</h3>
              <p className='muted'>
                The current MVP is designed for Vercel and Next.js, and can later connect to storage, payments,
                and real quote records.
              </p>
            </div>
            <div className='inline-actions'>
              <Link href='/estimate' className='button button-primary'>
                Open Estimate Page
              </Link>
              <Link href='/track' className='button button-secondary'>
                View Tracking Page
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Why this stands out</div>
              <h2 className='section-title'>Built like a premium service business, not a generic repair shop</h2>
            </div>
            <p className='section-copy'>
              The site emphasizes clarity, status visibility, and quote control, with room for AI triage later.
            </p>
          </div>

          <div className='grid-3'>
            {testimonials.map((item) => (
              <div key={item.title} className='testimonial'>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
