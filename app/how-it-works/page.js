import Link from 'next/link'

const steps = [
  {
    title: 'Start with a free estimate',
    text: 'Upload photos, choose the device, and describe the issue before mailing anything in.',
  },
  {
    title: 'Receive a human review',
    text: 'Each request is checked by a real person so pricing, scope, and repair risk are reviewed before the job moves forward.',
  },
  {
    title: 'Approve before shipping',
    text: 'Nothing should move into the mail-in stage until the customer accepts the estimate and the next-step instructions.',
  },
  {
    title: 'Intake and inspection',
    text: 'When the device arrives, the intake condition is documented and the real repair condition is confirmed in hand.',
  },
  {
    title: 'Repair and testing',
    text: 'The job is completed, tested, and updated through the workflow before it is closed out.',
  },
  {
    title: 'Return shipping',
    text: 'The repaired device is shipped back with tracking so the customer can follow the last stage too.',
  },
]

const howItWorksImage =
  'https://images.unsplash.com/photo-1750744788280-aa47aba79a57?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=2200'

export default function HowItWorksPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <section
          className='quote-card'
          style={{
            overflow: 'hidden',
            gridTemplateColumns: '1.05fr 0.95fr',
            alignItems: 'stretch',
          }}
        >
          <div style={{ padding: 28, display: 'grid', alignContent: 'center', gap: 16 }}>
            <div className='kicker'>How it works</div>
            <h1 style={{ margin: 0 }}>A mail-in repair process built around clear approval steps</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 56 + 'ch' }}>
              This is designed to feel controlled from the first estimate all the way to the return
              shipment. Customers should know what happens before shipping, during repair, and before
              the device comes back.
            </p>

            <div className='inline-actions' style={{ marginBottom: 0 }}>
              <Link href='/estimate' className='button button-primary'>
                Start Free Estimate
              </Link>
              <Link href='/track' className='button button-secondary'>
                Track a Repair
              </Link>
            </div>
          </div>

          <div style={{ minHeight: 360, position: 'relative' }}>
            <img
              src={howItWorksImage}
              alt='Phones, tablets, and laptops arranged on a desk'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </section>

        <div className='grid-3'>
          {steps.map((step, index) => (
            <div key={step.title} className='feature-card'>
              <span className='price-chip'>Step {index + 1}</span>
              <h3 style={{ marginTop: 14 }}>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <section className='policy-card'>
          <div className='kicker'>Why this matters</div>
          <h3>This is not a “mail it and hope for the best” model</h3>
          <p>
            The workflow is structured to reduce uncertainty. Customers get a free estimate, approve
            before shipment, follow updates during repair, and receive tracked return shipping after
            the job is complete.
          </p>
        </section>

        <section className='cta-strip'>
          <div>
            <div className='kicker'>Ready to start?</div>
            <h3 className='card-title'>Open the estimate page and submit the repair request.</h3>
            <p className='muted'>That is the first real step in the customer journey.</p>
          </div>
          <Link href='/estimate' className='button button-primary'>
            Open Estimate Page
          </Link>
        </section>
      </div>
    </main>
  )
}