import Link from 'next/link'

const steps = [
  {
    title: 'Upload photos for a free estimate',
    text: 'Customers start without an account. They choose the category, brand, model, repair type, and upload photos.',
  },
  {
    title: 'Receive a human-reviewed preliminary quote',
    text: 'The estimate gives them a pricing preview while protecting you with ranges and inspection-required paths when needed.',
  },
  {
    title: 'Approve mail-in and pay the inspection deposit',
    text: 'Only approved customers move forward into the shipping and intake process.',
  },
  {
    title: 'Device intake and in-hand inspection',
    text: 'You log condition, confirm the issue, and issue the final quote if the job still fits scope.',
  },
  {
    title: 'Repair, test, and request final payment',
    text: 'The repair is completed on your schedule, then the customer receives status updates and payment instructions.',
  },
  {
    title: 'Tracked return shipping',
    text: 'The order closes only after payment and tracked return shipment is generated.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>How it works</div>
          <h1>Built for a controlled mail-in workflow</h1>
          <p>
            The website is designed around trust, clear approval gates, and realistic part-time repair operations.
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
            <div className='kicker'>Next action</div>
            <h3 className='card-title'>Move into the estimate page</h3>
            <p className='muted'>That page is the core conversion flow of the whole business.</p>
          </div>
          <Link href='/estimate' className='button button-primary'>Open Estimate Page</Link>
        </div>
      </div>
    </main>
  )
}
