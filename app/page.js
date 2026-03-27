import Link from 'next/link'
import StatusTracker from '../components/StatusTracker'
import { REPAIR_STATUS_STEPS, REPAIR_CATALOG } from '../lib/repairCatalog'

const deviceCards = [
  {
    title: 'Phones',
    text: 'Screen replacements, battery swaps, charging port repairs, camera fixes, and more.',
  },
  {
    title: 'Laptops',
    text: 'Batteries, keyboards, SSD upgrades, software recovery, and select hardware repairs.',
  },
  {
    title: 'Tablets',
    text: 'Glass and screen repairs, batteries, charging ports, and button replacements.',
  },
  {
    title: 'Desktops',
    text: 'Select repairs handled case-by-case when shipping logistics and repair scope allow.',
  },
]

const commonRepairs = [
  {
    title: 'Screen replacement',
    text: 'Cracked glass, dead pixels, or unresponsive touch — restored with quality replacement parts.',
  },
  {
    title: 'Battery replacement',
    text: 'Swollen, degraded, or fast-draining batteries replaced to restore full-day battery life.',
  },
  {
    title: 'Charging port repair',
    text: 'Loose connections, lint buildup, or damaged ports fixed so your device charges reliably.',
  },
  {
    title: 'Keyboard repair',
    text: 'Stuck, unresponsive, or damaged laptop keys replaced with OEM-compatible parts.',
  },
  {
    title: 'SSD upgrade',
    text: 'Upgrade your storage for faster boot times and more space, with data migration included.',
  },
  {
    title: 'Software recovery',
    text: 'OS reinstalls, virus removal, and data recovery for devices that will not boot or run slowly.',
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
            <div className='eyebrow'>Premium mail-in device repair</div>
            <h1>Repair your device with a process you can actually trust.</h1>
            <p>
              Get a free estimate with photos, approve the price before shipping,
              and track every step from intake to return delivery.
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
              <span className='badge'>90-day repair warranty</span>
              <span className='badge'>Tracked return shipping</span>
            </div>
          </div>

          <div className='hero-side'>
            <div className='hero-visual'>
              <div className='hero-visual-surface'>
                <div className='hero-device-laptop' />
                <div className='hero-device-tablet' />
                <div className='hero-device-phone' />
              </div>

              <div className='hero-visual-strip'>
                <div className='hero-strip-item'>
                  <strong>Free estimate</strong>
                  <span>before shipping</span>
                </div>
                <div className='hero-strip-item'>
                  <strong>You approve</strong>
                  <span>before work starts</span>
                </div>
                <div className='hero-strip-item'>
                  <strong>Tracked return</strong>
                  <span>after repair</span>
                </div>
              </div>
            </div>

            <div className='panel panel-dark'>
              <div className='kicker'>Live tracking</div>
              <h3>Know where your device is at every step</h3>
              <p>
                Follow your repair from received through inspection, repair, and return shipment — all from one tracking page.
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
              <h2 className='section-title'>Four steps from estimate to delivery</h2>
            </div>
          </div>

          <div className='steps-grid'>
            {[
              ['01', 'Submit your estimate', 'Upload photos, select your device, and describe the issue. It takes about two minutes.'],
              ['02', 'Get your quote', 'We review your request and send a detailed estimate with pricing and turnaround time.'],
              ['03', 'Approve and ship', 'Accept the estimate, pay the inspection deposit, and mail in your device.'],
              ['04', 'Track and receive', 'Follow the repair status in real time and get your device shipped back when it&apos;s done.'],
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
              <div className='kicker'>What we repair</div>
              <h2 className='section-title'>Phones, tablets, laptops, and select desktops</h2>
            </div>
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
              <h2 className='section-title'>Our most requested services</h2>
            </div>
          </div>

          <div className='grid-3'>
            {commonRepairs.map((repair) => (
              <div key={repair.title} className='repair-card'>
                <h3>{repair.title}</h3>
                <p>{repair.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>Sample pricing</div>
              <h2 className='section-title'>Real prices from our repair catalog</h2>
            </div>
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
              <div className='kicker'>Ready to start?</div>
              <h3 className='card-title'>Get your free estimate in two minutes.</h3>
              <p className='muted'>
                No account needed. Upload photos of your device and we&apos;ll send you a detailed quote.
              </p>
            </div>
            <div className='inline-actions'>
              <Link href='/estimate' className='button button-primary'>
                Get Free Estimate
              </Link>
              <Link href='/track' className='button button-secondary'>
                Track a Repair
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}