import Link from 'next/link'

const steps = [
  {
    title: 'Start with a free estimate',
    text: 'The customer uploads photos, selects the device and repair type, and explains the issue before mailing anything in.',
  },
  {
    title: 'Receive a real estimate review',
    text: 'Each request is reviewed by a human so pricing, scope, and risk are checked before the job moves forward.',
  },
  {
    title: 'Approve before shipping',
    text: 'Nothing moves into the mail-in stage until the customer accepts the estimate and next-step instructions.',
  },
  {
    title: 'Device intake and inspection',
    text: 'Once the device arrives, intake condition is documented and the repair is inspected in hand.',
  },
  {
    title: 'Repair, test, and finalize payment',
    text: 'The job is completed, tested, and moved into final payment only when the repair is ready to close out.',
  },
  {
    title: 'Return shipping with tracking',
    text: 'The repaired device is shipped back with tracked return delivery so the customer can follow the last stage too.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>How it works</div>
          <h1>A mail-in repair process built around clear approval steps</h1>
          <p>
            The goal is simple: customers should know what happens before shipping, during repair,
            and before return delivery — without guessing.
          </p>
        </div>

        <div className='grid-3'>
          {steps.map((step, index) => (
            <div key={step.title} className='feature-card'>
              <span className='price-chip'>Step {index + 1}</span>
              <h3 style={{ marginTop: 14 }}>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <div className='policy-card'>
          <div className='kicker'>Why this matters</div>
          <h3>This is not a “mail it and hope for the best” model</h3>
          <p>
            The system is intentionally designed to reduce uncertainty. Customers get a free estimate,
            approve before shipment, follow updates during repair, and receive tracked return shipping
            after the job is complete.
          </p>
        </div>

        <div className='cta-strip'>
          <div>
            <div className='kicker'>Ready to start?</div>
            <h3 className='card-title'>Open the estimate page and submit the repair request.</h3>
            <p className='muted'>That is the first real step in the customer journey.</p>
          </div>
          <Link href='/estimate' className='button button-primary'>
            Open Estimate Page
          </Link>
        </div>
      </div>
    </main>
  )
}