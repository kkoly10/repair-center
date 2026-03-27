import Link from 'next/link'
import { REPAIR_CATALOG } from '../../lib/repairCatalog'

const grouped = REPAIR_CATALOG.reduce((acc, item) => {
  acc[item.category] ??= []
  acc[item.category].push(item)
  return acc
}, {})

export default function DevicesPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Supported devices</div>
          <h1>Devices we currently service</h1>
          <p>
            Choose your device below to see how many repair options are available,
            then start a free estimate when you're ready.
          </p>
          <div className='inline-actions'>
            <Link href='/estimate' className='button button-primary button-compact'>
              Get Free Estimate
            </Link>
          </div>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className='list-card'>
            <h3 style={{ textTransform: 'capitalize' }}>{category}s</h3>
            <div className='grid-3' style={{ marginTop: 18 }}>
              {items.map((item) => (
                <div key={item.modelKey} className='feature-card'>
                  <span className='mini-chip'>{item.brand}</span>
                  <h3 style={{ marginTop: 14 }}>{item.model}</h3>
                  <p>
                    {item.repairs.length} supported repair
                    {item.repairs.length === 1 ? '' : 's'}
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <Link href='/estimate' className='button button-secondary button-compact'>
                      Get Estimate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}