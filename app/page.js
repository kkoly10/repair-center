import Link from 'next/link'
import StatusTracker from '../components/StatusTracker'
import { REPAIR_STATUS_STEPS, REPAIR_CATALOG } from '../lib/repairCatalog'

const deviceCards = [
  {
    title: 'Phones',
    text: 'Screen damage, batteries, charging problems, cameras, speakers, and common hardware issues for supported models.',
  },
  {
    title: 'Laptops',
    text: 'Battery service, keyboard replacement, storage upgrades, software recovery, and selected hardware repairs that fit a practical mail-in workflow.',
  },
  {
    title: 'Tablets',
    text: 'Glass and screen repairs, battery service, charging issues, and common iPad and tablet repairs for supported models.',
  },
  {
    title: 'Selective desktop jobs',
    text: 'Handled through manual review only when the shipping risk and repair scope make sense for a mail-in service.',
  },
]

const commonRepairs = [
  'Screen replacement',
  'Battery replacement',
  'Charging port repair',
  'Keyboard repair',
  'SSD upgrade and setup',
  'Software recovery and cleanup',
]

const trustPoints = [
  {
    title: 'Clear before you ship',
    text: 'Customers start with photos and device details first. That keeps the process low-friction and helps filter unrealistic jobs before anything is mailed.',
  },
  {
    title: 'Approval before repair',
    text: 'The repair flow is structured so work is not quietly pushed forward without a visible estimate, approval step, and tracked status updates.',
  },
  {
    title: 'Built for real operations',
    text: 'This system is designed around controlled intake, part-time technician capacity, inspection checkpoints, and return shipping visibility.',
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
            <div className='eyebrow'>Mail-in phone, tablet, and laptop repair</div>
            <h1>Repair your device without guessing what happens next.</h1>
            <p>
              Start with a free photo estimate, approve the repair before mailing anything in,
              track each stage of the job, and follow return shipping from one place.
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
              <span className='badge'>Human-reviewed estimates</span>
              <span className='badge'>Tracked repair workflow</span>
              <span className='badge'>Secure return shipping</span>
            </div>
          </div>

          <div className='hero-side'>
            <div className='hero-card metric-grid'>
              <div className='metric'>
                <strong>Free</strong>
                <span>photo estimate before shipping</span>
              </div>
              <div className='metric'>
                <strong>Tracked</strong>
                <span>from quote to return delivery</span>
              </div>
              <div className='metric'>
                <strong>90-day</strong>
                <span>limited warranty on supported repairs</span>
              </div>
              <div className='metric'>
                <strong>Selective</strong>
                <span>service menu built for practical mail-in work</span>
              </div>
            </div>

            <div className='panel'>
              <div className='kicker'>Tracking preview</div>
              <h3>Repair progress with real checkpoints</h3>
              <p>
                Customers can see where the repair stands instead of wondering whether the device
                was received, inspected, approved, repaired, or shipped back.
              </p>
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
              <h2 className='section-title'>A trust-first workflow for mail-in repairs</h2>
            </div>
            <p className='section-copy'>
              The business is structured around estimate first, approval before shipping,
              inspection after intake, and clear updates all the way to return delivery.
            </p>
          </div>

          <div className='steps-grid'>
            {[
              ['01', 'Submit your estimate', 'Upload photos, choose your device, and describe the problem.'],
              ['02', 'Review the quote', 'We review the request and send a repair estimate or next-step guidance.'],
              ['03', 'Approve before mail-in', 'You only move forward if you accept the estimate and next step.'],
              ['04', 'Track repair progress', 'Follow intake, inspection, repair, payment, and return shipping from one place.'],
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
              <div className='kicker'>What we work on</div>
              <h2 className='section-title'>Focused on the devices people actually depend on</h2>
            </div>
            <p className='section-copy'>
              A tighter launch scope makes the business more trustworthy, easier to operate, and
              more consistent than trying to promise every repair under the sun.
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
              <div className='kicker'>Common repair categories</div>
              <h2 className='section-title'>Built around repeatable repairs that fit mail-in operations</h2>
            </div>
            <p className='section-copy'>
              The best early jobs are predictable repairs with practical shipping, realistic labor,
              and parts that can be sourced with confidence.
            </p>
          </div>

          <div className='grid-3'>
            {commonRepairs.map((repair) => (
              <div key={repair} className='repair-card'>
                <span className='price-chip'>Common request</span>
                <h3 style={{ marginTop: 14 }}>{repair}</h3>
                <p>
                  Submitted through the estimate flow first, then confirmed through inspection and
                  approval if the real condition changes the scope.
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
              <div className='kicker'>Supported pricing foundation</div>
              <h2 className='section-title'>Model-based catalog structure behind the estimate flow</h2>
            </div>
            <p className='section-copy'>
              Customers can already choose a category, brand, model, and repair type. That gives
              the site a real operational foundation instead of a fake quote form.
            </p>
          </div>

          <div className='grid-3'>
            {highlightedRepairs.map((item) => (
              <div key={`${item.model}-${item.preview.key}`} className='feature-card'>
                <span className='mini-chip'>
                  {item.brand} · {item.category}
                </span>
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
              <div className='kicker'>Start here</div>
              <h3 className='card-title'>Get the free estimate first.</h3>
              <p className='muted'>
                That is the front door of the business and the first step before any device is mailed in.
              </p>
            </div>
            <div className='inline-actions'>
              <Link href='/estimate' className='button button-primary'>
                Open Estimate Page
              </Link>
              <Link href='/track' className='button button-secondary'>
                Track a Repair
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Why customers trust this model</div>
              <h2 className='section-title'>More transparent than the usual repair-shop experience</h2>
            </div>
            <p className='section-copy'>
              The public site is designed to feel controlled, clear, and professional — not vague,
              rushed, or generic.
            </p>
          </div>

          <div className='grid-3'>
            {trustPoints.map((item) => (
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