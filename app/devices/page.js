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
          <div className='kicker'>Devices</div>
          <h1>Starter catalog by category, brand, and model</h1>
          <p>
            This launch version already includes a seeded pricing catalog for a short list of supported models.
            You can expand it over time without redesigning the customer flow.
          </p>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className='list-card'>
            <h3 style={{ textTransform: 'capitalize' }}>{category}</h3>
            <div className='grid-3' style={{ marginTop: 18 }}>
              {items.map((item) => (
                <div key={item.modelKey} className='feature-card'>
                  <span className='mini-chip'>{item.brand}</span>
                  <h3 style={{ marginTop: 14 }}>{item.model}</h3>
                  <p>{item.repairs.length} repair types seeded in the starter catalog.</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
