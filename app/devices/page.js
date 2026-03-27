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
          <h1>Browse supported models before you request an estimate</h1>
          <p>
            The repair flow already uses a model-based catalog so customers can choose the right
            device and repair path instead of submitting a vague generic request.
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
                  <p>
                    {item.repairs.length} supported repair
                    {item.repairs.length === 1 ? '' : 's'} in the current catalog.
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}