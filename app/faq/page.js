const faqs = [
  {
    question: 'Do I need an account to request an estimate?',
    answer:
      'No. You can submit a free estimate request without creating an account. The flow is designed to keep the first step simple.',
  },
  {
    question: 'Is the photo estimate always the final price?',
    answer:
      'No. Photo estimates are preliminary unless clearly marked otherwise. Final pricing may change after in-hand inspection if hidden damage or added parts are involved.',
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
    question: 'What if the inspection changes the repair scope?',
    answer:
      'If inspection reveals more damage or different repair needs, a revised estimate can be issued before work continues.',
  },
  {
    question: 'What should I do before mailing my device?',
    answer:
      'Back up your data, remove any SIM or memory cards if appropriate, and follow the mail-in instructions shown after approval.',
  },
]

export default function FaqPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>FAQ</div>
          <h1>Questions customers usually have before mailing in a device</h1>
          <p>
            For a mail-in repair service, clarity is part of the product. Customers should understand
            the process before they ever package a device.
          </p>
        </div>

        <div className='grid-2'>
          {faqs.map((faq) => (
            <div key={faq.question} className='faq-card'>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}