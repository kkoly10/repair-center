import Link from 'next/link'
import Image from 'next/image'
import { REPAIR_CATALOG } from '../lib/repairCatalog'

const deviceCards = [
  {
    title: 'Phones',
    text: 'Screen repairs, batteries, charging ports, cameras, and common hardware issues.',
    image: '/images/phone-repair.jpg',
  },
  {
    title: 'Laptops',
    text: 'Battery service, keyboards, storage upgrades, software recovery, and select hardware repairs.',
    image: '/images/laptop-open.jpg',
  },
  {
    title: 'Tablets',
    text: 'Glass and screen repairs, batteries, charging ports, and other common tablet repairs.',
    image: '/images/tablet-product.jpg',
  },
  {
    title: 'Select desktops',
    text: 'Handled case by case when the repair and shipping make sense for a mail-in service.',
    image: '/images/circuit-dark.jpg',
  },
]

const commonRepairs = [
  {
    title: 'Screen replacement',
    text: 'Cracked glass, dead pixels, or touch issues repaired with quality replacement parts.',
  },
  {
    title: 'Battery replacement',
    text: 'Weak, swollen, or fast-draining batteries replaced to restore reliable daily use.',
  },
  {
    title: 'Charging port repair',
    text: 'Loose, damaged, or inconsistent charging ports repaired so your device powers properly again.',
  },
  {
    title: 'Keyboard repair',
    text: 'Stuck, damaged, or unresponsive laptop keys repaired with compatible replacement parts.',
  },
  {
    title: 'SSD upgrade',
    text: 'Upgrade storage for faster performance, more space, and smoother everyday use.',
  },
  {
    title: 'Software recovery',
    text: 'Help for devices that will not boot, run poorly, or need a clean operating system reinstall.',
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
      <section className='hero-full'>
        <div className='site-shell hero-full-grid'>
          <div className='hero-full-copy'>
            <div className='hero-full-eyebrow'>Premium mail-in device repair</div>
            <h1>Mail-in device repair you can trust.</h1>
            <p>
              Repair for phones, tablets, and laptops with a simple estimate process,
              clear approval steps, and tracked return shipping.
            </p>

            <div className='hero-actions-row'>
              <Link href='/instant-estimate' className='button button-primary'>
                Instant Estimate
              </Link>
              <Link href='/estimate' className='button button-outline'>
                Full Estimate Form
              </Link>
              <Link href='/repairs' className='button button-outline'>
                See Repair Services
              </Link>
            </div>
          </div>

          <div className='hero-full-devices'>
            <div className='hero-device-img hero-device-img-phone'>
              <Image
                src='/images/phone-repair.jpg'
                alt='Phone repair'
                width={220}
                height={420}
                style={{ objectFit: 'cover', borderRadius: 24 }}
                priority
              />
            </div>

            <div className='hero-device-img hero-device-img-tablet'>
              <Image
                src='/images/tablet-product.jpg'
                alt='Tablet repair'
                width={320}
                height={240}
                style={{ objectFit: 'cover', borderRadius: 18 }}
                priority
              />
            </div>

            <div className='hero-device-img hero-device-img-laptop'>
              <Image
                src='/images/laptop-open.jpg'
                alt='Laptop repair'
                width={480}
                height={320}
                style={{ objectFit: 'cover', borderRadius: 14 }}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className='process-bar'>
        <div className='site-shell process-bar-inner'>
          <div className='process-step'>
            <div className='process-icon'>
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                <polyline points='14 2 14 8 20 8' />
                <line x1='16' y1='13' x2='8' y2='13' />
                <line x1='16' y1='17' x2='8' y2='17' />
              </svg>
            </div>
            <span>Get a Quote</span>
          </div>

          <div className='process-arrow'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='5' y1='12' x2='19' y2='12' />
              <polyline points='12 5 19 12 12 19' />
            </svg>
          </div>

          <div className='process-step'>
            <div className='process-icon'>
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <rect x='1' y='3' width='15' height='13' />
                <polygon points='16 8 20 8 23 11 23 16 16 16 16 8' />
                <circle cx='5.5' cy='18.5' r='2.5' />
                <circle cx='18.5' cy='18.5' r='2.5' />
              </svg>
            </div>
            <span>Ship Your Device</span>
          </div>

          <div className='process-arrow'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='5' y1='12' x2='19' y2='12' />
              <polyline points='12 5 19 12 12 19' />
            </svg>
          </div>

          <div className='process-step'>
            <div className='process-icon'>
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
                <polyline points='22 4 12 14.01 9 11.01' />
              </svg>
            </div>
            <span>Repair &amp; Return</span>
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
              <div key={card.title} className='device-card device-card-img'>
                <div className='device-card-thumb'>
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={400}
                    height={240}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='section section-dark-bg'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker kicker-dark-section'>Common repairs</div>
              <h2 className='section-title section-title-light'>Popular repair services</h2>
            </div>
          </div>

          <div className='grid-3'>
            {commonRepairs.map((repair) => (
              <div key={repair.title} className='repair-card repair-card-dark'>
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
              <h2 className='section-title'>Examples from supported repairs</h2>
            </div>
          </div>

          <div className='grid-3'>
            {highlightedRepairs.map((item) => (
              <div key={`${item.model}-${item.preview.key}`} className='feature-card'>
                <span className='mini-chip'>
                  {item.brand} &middot; {item.category}
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
              <h3 className='card-title'>Get your repair price in seconds.</h3>
              <p className='muted'>
                Use our instant estimator to see pricing right away, or submit a full estimate with photos.
              </p>
            </div>
            <div className='inline-actions'>
              <Link href='/instant-estimate' className='button button-primary'>
                Instant Estimate
              </Link>
              <Link href='/estimate' className='button button-secondary'>
                Full Estimate Form
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