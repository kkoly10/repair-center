import { getT } from '../../lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('repairsPage.metaTitle') }
}

const repairImage =
  'https://images.unsplash.com/photo-1771189958197-06850d4828af?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=2200'

export default async function RepairsPage() {
  const t = await getT()

  const repairBuckets = [
    {
      title: t('repairsPage.bucketPhonesTitle'),
      items: [
        t('repairsPage.bucketPhone1'),
        t('repairsPage.bucketPhone2'),
        t('repairsPage.bucketPhone3'),
        t('repairsPage.bucketPhone4'),
        t('repairsPage.bucketPhone5'),
        t('repairsPage.bucketPhone6'),
      ],
    },
    {
      title: t('repairsPage.bucketTabletsTitle'),
      items: [
        t('repairsPage.bucketTablet1'),
        t('repairsPage.bucketTablet2'),
        t('repairsPage.bucketTablet3'),
        t('repairsPage.bucketTablet4'),
        t('repairsPage.bucketTablet5'),
      ],
    },
    {
      title: t('repairsPage.bucketLaptopsTitle'),
      items: [
        t('repairsPage.bucketLaptop1'),
        t('repairsPage.bucketLaptop2'),
        t('repairsPage.bucketLaptop3'),
        t('repairsPage.bucketLaptop4'),
        t('repairsPage.bucketLaptop5'),
      ],
    },
  ]

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <section
          className='quote-card'
          style={{
            overflow: 'hidden',
            gridTemplateColumns: '0.95fr 1.05fr',
            alignItems: 'stretch',
          }}
        >
          <div style={{ minHeight: 360, position: 'relative' }}>
            <img
              src={repairImage}
              alt={t('repairsPage.imageAlt')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          <div style={{ padding: 28, display: 'grid', alignContent: 'center', gap: 16 }}>
            <div className='kicker'>{t('repairsPage.kicker')}</div>
            <h1 style={{ margin: 0 }}>{t('repairsPage.heroTitle')}</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 58 + 'ch' }}>{t('repairsPage.heroBody')}</p>
          </div>
        </section>

        <div className='grid-3'>
          {repairBuckets.map((bucket) => (
            <div key={bucket.title} className='list-card'>
              <h3>{bucket.title}</h3>
              <ul>
                {bucket.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className='policy-card'>
          <div className='kicker'>{t('repairsPage.noteKicker')}</div>
          <h3>{t('repairsPage.noteTitle')}</h3>
          <p>{t('repairsPage.noteBody')}</p>
        </section>
      </div>
    </main>
  )
}
