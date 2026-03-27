import Link from 'next/link'

const faqs = [
  {
    question: 'Do I need an account to request an estimate?',
    answer:
      'No. You can submit a free estimate using just your name and email. No account or sign-up required.',
  },
  {
    question: 'Is the photo estimate the final price?',
    answer:
      'Photo estimates are preliminary. Final pricing is confirmed after we inspect the device in hand. If the price changes, you&apos;ll receive a revised estimate for approval before any work begins.',
  },
  {
    question: 'When do I ship my device?',
    answer:
      'Only after you review and approve the estimate. We send mail-in instructions with our shipping address and a packing checklist.',
  },
  {
    question: 'How long does the repair take?',
    answer:
      'Most repairs are completed within 3–7 business days after we receive the device. Turnaround estimates are included on your quote and depend on the repair type and parts availability.',
  },
  {
    question: 'How do I pay?',
    answer:
      'Payments are handled securely through Stripe. An inspection deposit may be required before we start work, and the remaining balance is collected before return shipping. Your deposit is credited toward the final total.',
  },
  {
    question: 'Can I track my repair?',
    answer:
      'Yes. Use your Quote ID or Order Number on the tracking page to see real-time status updates, messages from the repair team, and shipment tracking.',
  },
  {
    question: 'What if the inspection finds additional damage?',
    answer:
      'We send you a revised estimate explaining what changed. You can approve the new price or decline and have the device returned.',
  },
  {
    question: 'What if my device cannot be repaired?',
    answer:
      'If we determine the device is beyond economical repair or no fault is found, we&apos;ll contact you and return it with a report of our findings.',
  },
  {
    question: 'Do you offer a warranty?',
    answer:
      'Yes. Completed repairs include a limited warranty (typically 90 days) covering the specific work performed. The warranty period is stated on your estimate.',
  },
  {
    question: 'What should I do before mailing my device?',
    answer:
      'Back up your data, disable Find My Device / Activation Lock, remove SIM cards and memory cards, and remove cases or screen protectors.',
  },
  {
    question: 'What carriers can I use to ship my device?',
    answer:
      'You can use any carrier (USPS, UPS, FedEx). We recommend using a tracked and insured shipping method. Detailed instructions are provided after approval.',
  },
  {
    question: 'What happens if I decline the estimate?',
    answer:
      'No problem. If you decline before shipping, nothing else is needed. If you decline a revised estimate after inspection, we&apos;ll return the device to you.',
  },
  {
    question: 'How do I contact the repair team?',
    answer:
      'Use the message thread on your tracking page. You can send messages directly to the repair team and receive replies there.',
  },
  {
    question: 'Do you repair desktops?',
    answer:
      'Select desktop repairs are handled on a case-by-case basis when the shipping logistics, device value, and repair scope make sense. Submit an estimate request and we&apos;ll review it.',
  },
]

export default function FaqPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>FAQ</div>
          <h1>Frequently asked questions</h1>
          <p>
            Everything you need to know before submitting an estimate or mailing in your device.
          </p>
          <div className='inline-actions'>
            <Link href='/estimate' className='button button-primary button-compact'>
              Get Free Estimate
            </Link>
          </div>
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