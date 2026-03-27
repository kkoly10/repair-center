import Link from 'next/link'

const faqs = [
  {
    question: 'Do I need an account to request an estimate?',
    answer:
      'No. You can submit a free estimate request without creating an account. The first step is designed to stay simple.',
  },
  {
    question: 'Is the photo estimate always the final price?',
    answer:
      'No. Photo estimates are preliminary unless clearly marked otherwise. Final pricing can change after in-hand inspection if hidden damage or additional parts are involved.',
  },
  {
    question: 'When do I ship my device?',
    answer:
      'You only move into the mail-in stage after reviewing and approving the estimate or next step shown in your repair flow.',
  },
  {
    question: 'Can I track the repair after approval?',
    answer:
      'Yes. Once your repair request moves forward, you can follow status updates, shipment changes, and repair messages from the tracking page.',
  },
  {
    question: 'What if inspection changes the repair scope?',
    answer:
      'If inspection reveals more damage or different repair needs, a revised estimate can be issued before work continues.',
  },
  {
    question: 'What should I do before mailing my device?',
    answer:
      'Back up your data, remove any SIM or memory cards if appropriate, and follow the mail-in instructions shown after approval.',
  },
  {
    question: 'Will I approve the repair before work starts?',
    answer:
      'Yes. The workflow is structured around visible approval points so the repair does not quietly move forward without your decision.',
  },
  {
    question: 'Do you work on every device?',
    answer:
      'No. The launch service menu is intentionally focused on phones, tablets, laptops, and selected jobs that fit a practical mail-in workflow.',
  },
]

export default function FaqPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <section
          className='quote-card'
          style={{
            overflow: 'hidden',
            gridTemplateColumns: '1fr 1fr',
            alignItems: 'stretch',
          }}
        >
          <div style={{ padding: 28, display: 'grid', alignContent: 'center', gap: 16 }}>
            <div className='kicker'>FAQ</div>
            <h1 style={{ margin: 0 }}>Answers to the questions customers usually have before mailing in a device</h1>
            <p className='muted' style={{ margin: 0, maxWidth: 58 + 'ch' }}>
              For a mail-in repair service, clarity is part of the product. Customers should understand
              the process before they package an expensive device and send it out.
            </p>

            <div className='inline-actions' style={{ marginBottom: 0 }}>
              <Link href='/estimate' className='button button-primary'>
                Start Free Estimate
              </Link>
              <Link href='/how-it-works' className='button button-secondary'>
                See How It Works
              </Link>
            </div>
          </div>

          <div style={{ minHeight: 340, position: 'relative' }}>
            <img
              src='/images/laptop-open.jpg'
              alt='Laptop on a desk'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </section>

        <div className='grid-2'>
          {faqs.map((faq) => (
            <div key={faq.question} className='faq-card'>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>

        <section className='policy-card'>
          <div className='kicker'>Still unsure?</div>
          <h3>Start with the estimate first</h3>
          <p>
            The estimate request is the best first step because it lets the repair workflow collect
            your device details, photos, and issue summary before anything is shipped.
          </p>
        </section>
      </div>
    </main>
  )
}