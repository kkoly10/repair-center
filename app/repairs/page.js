const repairBuckets = [
  {
    title: 'Phone repairs',
    items: [
      'Screen replacement',
      'Battery replacement',
      'Charging port repair',
      'Rear camera repair',
      'Speaker and microphone issues',
      'Software recovery and restore',
    ],
  },
  {
    title: 'Tablet repairs',
    items: [
      'Glass and screen service',
      'Battery replacement',
      'Charging issues',
      'Button and port repairs',
      'Software troubleshooting',
    ],
  },
  {
    title: 'Laptop repairs',
    items: [
      'Battery replacement',
      'Keyboard and trackpad repair',
      'SSD upgrade and installation',
      'Operating system reinstall',
      'General cleanup and tune-up',
    ],
  },
]

const repairImage =
  'https://images.unsplash.com/photo-1771189958197-06850d4828af?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=2200'

export default function RepairsPage() {
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
              alt='Close-up of an electronic circuit board'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          <div style={{ padding: 28, display: 'grid', alignContent: 'center', gap: 16 }}>
            <div className='kicker'>Repair services</div>
            <h1 style={{ margin: 0 }}>Common repairs for the devices people use every day</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 58 + 'ch' }}>
              We focus on repair categories that are practical for a mail-in service and easy for
              customers to start with through the estimate process.
            </p>
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
          <div className='kicker'>Before you send it in</div>
          <h3>Some repairs need inspection before final approval</h3>
          <p>
            Certain issues, especially liquid damage, no-power problems, or hidden internal damage,
            may need in-hand inspection before the repair can be fully confirmed.
          </p>
        </section>
      </div>
    </main>
  )
}