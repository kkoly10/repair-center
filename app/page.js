import Image from 'next/image'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { getT } from '../lib/i18n/server'
import { REPAIR_CATALOG } from '../lib/repairCatalog'

const highlightedRepairs = REPAIR_CATALOG.slice(0, 6).map((entry) => ({
  model: entry.model,
  brand: entry.brand,
  category: entry.category,
  preview: entry.repairs[0],
}))

export default async function HomePage() {
  const t = await getT()

  const deviceCards = [
    { title: t('home.deviceCardPhones'),    text: t('home.deviceCardPhonesText'),    image: '/images/phone-repair.jpg' },
    { title: t('home.deviceCardLaptops'),   text: t('home.deviceCardLaptopsText'),   image: '/images/laptop-open.jpg' },
    { title: t('home.deviceCardTablets'),   text: t('home.deviceCardTabletsText'),   image: '/images/tablet-product.jpg' },
    { title: t('home.deviceCardDesktops'),  text: t('home.deviceCardDesktopsText'),  image: '/images/circuit-dark.jpg' },
  ]

  const commonRepairs = [
    { title: t('home.repairScreen'),   text: t('home.repairScreenText') },
    { title: t('home.repairBattery'),  text: t('home.repairBatteryText') },
    { title: t('home.repairCharging'), text: t('home.repairChargingText') },
    { title: t('home.repairKeyboard'), text: t('home.repairKeyboardText') },
    { title: t('home.repairSsd'),      text: t('home.repairSsdText') },
    { title: t('home.repairSoftware'), text: t('home.repairSoftwareText') },
  ]

  return (
    <main>
      <section className='hero-full'>
        <div className='site-shell hero-full-grid'>
          <div className='hero-full-copy'>
            <div className='hero-full-eyebrow'>{t('home.heroEyebrow')}</div>
            <h1>{t('home.heroTitle')}</h1>
            <p>{t('home.heroDescription')}</p>

            <div className='hero-actions-row'>
              <LocalizedLink href='/instant-estimate' className='button button-primary'>
                {t('home.ctaInstantEstimate')}
              </LocalizedLink>
              <LocalizedLink href='/estimate' className='button button-outline'>
                {t('home.ctaFullEstimate')}
              </LocalizedLink>
              <LocalizedLink href='/repairs' className='button button-outline'>
                {t('home.seeRepairServices')}
              </LocalizedLink>
            </div>
          </div>

          <div className='hero-full-devices'>
            <div className='hero-device-img hero-device-img-phone'>
              <Image
                src='/images/phone-repair.jpg'
                alt={t('home.altPhoneRepair')}
                width={220}
                height={420}
                style={{ objectFit: 'cover', borderRadius: 24 }}
                priority
              />
            </div>

            <div className='hero-device-img hero-device-img-tablet'>
              <Image
                src='/images/tablet-product.jpg'
                alt={t('home.altTabletRepair')}
                width={320}
                height={240}
                style={{ objectFit: 'cover', borderRadius: 18 }}
                priority
              />
            </div>

            <div className='hero-device-img hero-device-img-laptop'>
              <Image
                src='/images/laptop-open.jpg'
                alt={t('home.altLaptopRepair')}
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
            <span>{t('home.processGetQuote')}</span>
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
            <span>{t('home.processShipDevice')}</span>
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
            <span>{t('home.processRepairReturn')}</span>
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='site-shell'>
          <div className='section-head'>
            <div>
              <div className='kicker'>{t('home.whatWeRepair')}</div>
              <h2 className='section-title'>{t('home.whatWeRepairTitle')}</h2>
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
              <div className='kicker kicker-dark-section'>{t('home.commonRepairs')}</div>
              <h2 className='section-title section-title-light'>{t('home.popularRepairs')}</h2>
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
              <div className='kicker'>{t('home.samplePricing')}</div>
              <h2 className='section-title'>{t('home.samplePricingTitle')}</h2>
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
                      : t('home.inspectionRequired')}
                </div>
              </div>
            ))}
          </div>

          <div className='cta-strip'>
            <div>
              <div className='kicker'>{t('home.readyToStart')}</div>
              <h3 className='card-title'>{t('home.readyHeading')}</h3>
              <p className='muted'>
                {t('home.readyBody')}
              </p>
            </div>
            <div className='inline-actions'>
              <LocalizedLink href='/instant-estimate' className='button button-primary'>
                {t('home.ctaInstantEstimate')}
              </LocalizedLink>
              <LocalizedLink href='/estimate' className='button button-secondary'>
                {t('home.ctaFullEstimate')}
              </LocalizedLink>
              <LocalizedLink href='/track' className='button button-secondary'>
                {t('home.trackARepair')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
