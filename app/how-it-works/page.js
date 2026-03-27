import Link from 'next/link'

const steps = [
  {
    title: 'Submit a free estimate',
    text: 'Upload photos of your device, select the model and repair type, and describe the problem. Takes about two minutes.',
  },
  {
    title: 'Get your quote',
    text: 'We review your submission and send a detailed estimate with pricing, expected turnaround, and next steps.',
  },
  {
    title: 'Approve and pay deposit',
    text: 'Review the estimate at your own pace. If it looks right, approve it and pay the inspection deposit to get started.',
  },
  {
    title: 'Ship your device',
    text: 'Follow the mail-in instructions with our shipping address and packing checklist. Use any tracked carrier.',
  },
  {
    title: 'Inspection and repair',
    text: 'We inspect the device, confirm or revise the estimate if needed, then complete the repair and test everything.',
  },
  {
    title: 'Pay balance and receive',
    text: 'Pay the remaining balance and we ship your repaired device back with tracking. Follow the return from your tracking page.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>How it works</div>
          <h1>Six steps from estimate to delivery</h1>
          <p>
            You'll know exactly what's happening at every stage — no surprises, no guessing.
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

        <div className='cta-strip'>
          <div>
            <div className='kicker'>Ready to start?</div>
            <h3 className='card-title'>Get your free estimate in two minutes.</h3>
            <p className='muted'>No account needed. Just photos, device details, and a description of the issue.</p>
          </div>
          <Link href='/estimate' className='button button-primary'>
            Get Free Estimate
          </Link>
        </div>
      </div>
    </main>
  )
}