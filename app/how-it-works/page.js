import Link from 'next/link'

const steps = [
  {
    title: 'Start with a free estimate',
    text: 'Upload photos, choose your device, and describe the issue before mailing anything in.',
  },
  {
    title: 'Receive your quote',
    text: 'We review the request and send the next step based on the repair details you provided.',
  },
  {
    title: 'Approve before shipping',
    text: 'You only move forward when you are ready to continue with the repair process.',
  },
  {
    title: 'Device intake and inspection',
    text: 'Once your device arrives, it is checked in and inspected before the repair moves forward.',
  },
  {
    title: 'Repair and testing',
    text: 'Your device is repaired, tested, and prepared for return once the work is complete.',
  },
  {
    title: 'Return shipping',
    text: 'Your repaired device is shipped back with tracking so you can follow the final step too.',
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
            <h1 style={{ margin: 0 }}>A simple mail-in repair process from estimate to return delivery</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 56 + 'ch' }}>
              The process is designed to stay clear and easy to follow from the moment you request
              an estimate to the day your device is shipped back.
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
          <div className='kicker'>What to expect</div>
          <h3>Clear steps before, during, and after the repair</h3>
          <p>
            You start with an estimate, approve the next step before shipping, follow progress while
            the repair is underway, and receive tracking when the device is on the way back.
          </p>
        </section>

        <section className='cta-strip'>
          <div>
            <div className='kicker'>Ready to begin?</div>
            <h3 className='card-title'>Start with the estimate request.</h3>
            <p className='muted'>That is the first step before anything is mailed in.</p>
          </div>
          <Link href='/estimate' className='button button-primary'>
            Open Estimate Page
          </Link>
        </section>
      </div>
    </main>
  )
}