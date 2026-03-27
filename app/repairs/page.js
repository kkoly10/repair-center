const repairBuckets = [
  {
    title: 'Phone repairs',
    items: [
      'Screen replacement',
      'Battery replacement',
      'Charging port repair',
      'Rear camera repair',
      'Speaker / microphone issues',
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

export default function RepairsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Repair services</div>
          <h1>Repairs built around jobs that make sense for a mail-in business</h1>
          <p>
            The service menu is intentionally focused. That helps keep turnaround realistic,
            pricing cleaner, and customer expectations clearer.
          </p>
        </div>

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

        <div className='policy-card'>
          <div className='kicker'>Manual review only</div>
          <h3>Some jobs stay quote-first until reviewed in hand</h3>
          <p>
            Liquid damage, board-level no-power issues, bent housings, biometric failures,
            and unusual desktop repairs should stay in manual review until the device has been
            properly evaluated and the repair risk is understood.
          </p>
        </div>
      </div>
    </main>
  )
}