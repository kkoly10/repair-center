import Link from 'next/link'

export const metadata = {
  title: 'Contact — RepairCenter',
  description: 'Get in touch with the RepairCenter team. Questions about the platform, pricing, or your account.',
}

export default function ContactPage() {
  return (
    <main className="page-hero">
      <div className="site-shell page-stack">
        <div className="info-card">
          <div className="kicker">Contact</div>
          <h1>Get in touch</h1>
          <p>
            Questions about the platform, your trial, pricing, or anything else —
            send us an email and we will get back to you within one business day.
          </p>
        </div>

        <div className="grid-2">
          <div className="feature-card">
            <div className="mini-chip" style={{ marginBottom: 12 }}>General</div>
            <h3>Questions &amp; support</h3>
            <p>
              For questions about RepairCenter, your account, or how the platform works.
            </p>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@repaircenter.app'}`}
              className="button button-primary"
              style={{ marginTop: 16, display: 'inline-block' }}
            >
              Email us
            </a>
          </div>

          <div className="feature-card">
            <div className="mini-chip" style={{ marginBottom: 12 }}>Sales</div>
            <h3>Thinking about signing up?</h3>
            <p>
              Not ready to start a trial yet? We are happy to answer questions about
              whether RepairCenter is the right fit for your shop.
            </p>
            <Link href="/signup" className="button button-secondary" style={{ marginTop: 16, display: 'inline-block' }}>
              Start free trial instead
            </Link>
          </div>
        </div>

        <div className="faq-card">
          <h3>Before you email — quick answers</h3>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li>The free trial is 14 days, no credit card required.</li>
            <li>You can cancel anytime from your billing page — no contract.</li>
            <li>Mail-in and in-store repairs are both supported on all plans.</li>
            <li>Stripe is optional — manual payment mode is available.</li>
          </ul>
          <div style={{ marginTop: 16 }}>
            <Link href="/for-shops#faq" className="button button-ghost button-compact">
              See all FAQs
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
