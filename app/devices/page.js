import { REPAIR_CATALOG } from '../../lib/repairCatalog'

const grouped = REPAIR_CATALOG.reduce((acc, item) => {
  acc[item.category] ??= []
  acc[item.category].push(item)
  return acc
}, {})

const devicesImage =
  'https://images.unsplash.com/photo-1710855492709-aa06902e181c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=2200'

export default function DevicesPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <section
          className='quote-card'
          style={{
            overflow: 'hidden',
            gridTemplateColumns: '1.02fr 0.98fr',
            alignItems: 'stretch',
          }}
        >
          <div style={{ padding: 28, display: 'grid', alignContent: 'center', gap: 16 }}>
            <div className='kicker'>Supported devices</div>
            <h1 style={{ margin: 0 }}>Browse supported models before requesting an estimate</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 56 + 'ch' }}>
              Choose the device that matches yours so the estimate request starts with the right
              repair options and pricing path.
            </p>
          </div>

          <div style={{ minHeight: 360, position: 'relative' }}>
            <img
              src={devicesImage}
              alt='A laptop, tablet, and phone on a white desk'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </section>

        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className='list-card'>
            <div className='kicker' style={{ textTransform: 'capitalize' }}>
              {category}
            </div>
            <h3 style={{ marginTop: 0 }}>
              {category.charAt(0).toUpperCase() + category.slice(1)} models
            </h3>

            <div className='grid-3' style={{ marginTop: 18 }}>
              {items.map((item) => (
                <div key={item.modelKey} className='feature-card'>
                  <span className='mini-chip'>{item.brand}</span>
                  <h3 style={{ marginTop: 14 }}>{item.model}</h3>
                  <p>
                    {item.repairs.length} supported repair
                    {item.repairs.length === 1 ? '' : 's'} available for this model.
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}