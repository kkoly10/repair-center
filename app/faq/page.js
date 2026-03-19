const faqs = [
  {
    question: 'Do customers need an account to request an estimate?',
    answer: 'No. The site is intentionally built around a low-friction guest estimate flow.',
  },
  {
    question: 'Will the photo estimate always be final?',
    answer: 'No. The site clearly positions it as a preliminary estimate. Final pricing happens after inspection when needed.',
  },
  {
    question: 'Can this later support AI?',
    answer: 'Yes. The structure supports future AI FAQ, intake guidance, and photo-triage layers without changing the overall flow.',
  },
  {
    question: 'Does this already connect to payments and a database?',
    answer: 'Not yet. This first build is a polished Next.js front end designed to be extended with storage, auth, payments, and an admin dashboard later.',
  },
]

export default function FaqPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Support and FAQ</div>
          <h1>Questions the site should answer clearly</h1>
          <p>
            For a mail-in repair brand, clarity matters almost as much as the repair itself. These pages reduce friction before a customer leaves.
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
