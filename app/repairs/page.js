import Link from 'next/link'

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
          <h1>What we repair</h1>
          <p>
            We focus on the repairs that work well for a mail-in service — predictable scope,
            reliable parts, and realistic turnaround times.
          </p>
          <div className='inline-actions'>
            <Link href='/estimate' className='button button-primary button-compact'>
              Get Free Estimate
            </Link>
            <Link href='/devices' className='button button-secondary button-compact'>
              View Supported Devices
            </Link>
          </div>
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
              <div style={{ marginTop: 14 }}>
                <Link href='/estimate' className='button button-secondary button-compact'>
                  Start an Estimate
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className='policy-card'>
          <div className='kicker'>Manual review only</div>
          <h3>Some repairs require in-hand evaluation first</h3>
          <p>
            Liquid damage, board-level failures, bent housings, biometric issues,
            and complex desktop repairs are evaluated after inspection. Submit an estimate
            and we&apos;ll let you know what&apos;s possible.
          </p>
        </div>
      </div>
    </main>
  )
}