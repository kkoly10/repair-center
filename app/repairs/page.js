const repairBuckets = [
  {
    title: 'Phone repairs',
    items: ['Screens', 'Batteries', 'Charging ports', 'Rear cameras', 'Software restore'],
  },
  {
    title: 'Tablet repairs',
    items: ['Glass and screen service', 'Battery replacements', 'Charging ports', 'Software issues'],
  },
  {
    title: 'Laptop repairs',
    items: ['Battery replacements', 'Keyboard repairs', 'SSD installs', 'OS reinstall', 'Tune-ups'],
  },
]

export default function RepairsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Repairs</div>
          <h1>Focus on common, repeatable jobs first</h1>
          <p>
            The strongest launch version of this business is not “we fix everything.” It is a disciplined service menu
            built around jobs that make sense for a mail-in workflow and part-time operation.
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
          <h3>Quote-only categories</h3>
          <p>
            Liquid damage, no-power board issues, severe bends, biometric failures, and unusual desktop jobs should stay
            in manual review until the business has more capacity, data, and sourcing confidence.
          </p>
        </div>
      </div>
    </main>
  )
}
