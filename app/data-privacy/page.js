import { LEGAL } from '../../lib/legalConfig'

export default function DataPrivacyPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Your privacy choices</div>
          <h1>Data privacy rights</h1>
          <p>
            <strong>Effective date:</strong> March 31, 2026
          </p>
          <p>
            At Repair Center, you are in control of your personal data. This page explains what
            data we hold, how long we keep it, and how you can access, export, or delete it. We
            are committed to compliance with the California Consumer Privacy Act (CCPA), the
            General Data Protection Regulation (GDPR), and other applicable privacy laws.
          </p>

          <h3>Your data, your choice</h3>
          <p>
            We believe transparency is fundamental to trust. When you use our mail-in repair
            service, we collect only the data necessary to process your repair, communicate with
            you, and meet our legal obligations. You have the right to understand, access, and
            control that data at any time.
          </p>

          <h3>What data we have</h3>
          <p>The following table summarizes the categories of data we collect, why we collect it, and how long we keep it:</p>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--border, #e2e2e2)', border: '1px solid var(--border, #e2e2e2)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem 1rem', fontWeight: 700, background: 'var(--bg-muted, #f5f5f5)' }}>Data type</div>
              <div style={{ padding: '0.75rem 1rem', fontWeight: 700, background: 'var(--bg-muted, #f5f5f5)' }}>Purpose</div>
              <div style={{ padding: '0.75rem 1rem', fontWeight: 700, background: 'var(--bg-muted, #f5f5f5)' }}>Retention period</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>Name, email, phone</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>Contact and communication</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>3 years after last interaction</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Device info (type, brand, model)</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Estimate and repair processing</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>3 years after last interaction</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>Device photos</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>Condition documentation</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>90 days after repair completion</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Repair records and notes</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Service history and warranty</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>3 years after last interaction</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>Payment records</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>Billing and tax compliance</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>7 years (legal requirement)</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Messages and communications</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Customer support</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>3 years after last interaction</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>IP address, browser type</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>Security and analytics</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg, #fff)' }}>12 months</div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Cookies and session data</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Authentication and preferences</div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f5f5f5)' }}>Session duration or up to 12 months</div>
            </div>
          </div>

          <h3>How to access your data</h3>
          <p>You have the right to know what personal data we hold about you. To request access:</p>
          <ul>
            <li><strong>Via email:</strong> Send a request to <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> with the subject line &ldquo;Data Access Request&rdquo;. Include your full name and Quote ID</li>
            <li><strong>Via your tracking page:</strong> Log in to your repair tracking page to view your repair records, communications, and status history</li>
          </ul>
          <p>
            We will verify your identity and respond with a complete summary of your data within 30 days. If we need additional time, we will notify you of the extension and the reason for the delay.
          </p>

          <h3>How to delete your data</h3>
          <p>You may request deletion of your personal data. Here is what you need to know:</p>
          <p><strong>Data that can be deleted upon request:</strong></p>
          <ul>
            <li>Contact information (name, email, phone)</li>
            <li>Device photos (if past 90-day auto-deletion window and no pending warranty claim)</li>
            <li>Messages and communication history</li>
            <li>Cookie and analytics data</li>
            <li>Marketing preferences and consent records</li>
          </ul>
          <p><strong>Data that cannot be immediately deleted:</strong></p>
          <ul>
            <li><strong>Payment records:</strong> Must be retained for 7 years for tax and legal compliance</li>
            <li><strong>Repair records under warranty:</strong> Retained until the warranty period expires</li>
            <li><strong>Data subject to legal holds:</strong> Retained as required by active legal proceedings or regulatory investigations</li>
          </ul>
          <p>
            To submit a deletion request, email <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> with the subject line &ldquo;Data Deletion Request&rdquo;. Include your full name and Quote ID. We will process your request within 30 days and confirm once deletion is complete.
          </p>

          <h3>How to opt out</h3>
          <p>You can opt out of non-essential communications at any time:</p>
          <ul>
            <li><strong>Marketing emails:</strong> Click the &ldquo;Unsubscribe&rdquo; link at the bottom of any marketing email, or email us at <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> with the subject line &ldquo;Unsubscribe&rdquo;</li>
            <li><strong>SMS notifications:</strong> Reply STOP to any SMS message, or email us to opt out of text notifications</li>
          </ul>
          <p>
            Please note that transactional communications (such as repair status updates, payment confirmations, and shipping notifications) cannot be opted out of, as they are essential to delivering our service.
          </p>

          <h3>Do not sell my information</h3>
          <p>
            <strong>We do not sell your personal information.</strong> We have never sold personal data and have no plans to do so.
          </p>
          <p>
            Under the California Consumer Privacy Act (CCPA), you have the right to opt out of the sale of your personal information. Because we do not sell personal data, no action is required on your part. If our practices ever change, we will update this page and provide a clear opt-out mechanism before any sale occurs.
          </p>
          <p>
            We also do not share your personal information for cross-context behavioral advertising as defined under the CCPA.
          </p>

          <h3>Data portability</h3>
          <p>
            You have the right to receive a copy of your personal data in a structured, commonly used, and machine-readable format. This allows you to transfer your data to another service provider if you choose.
          </p>
          <p><strong>Your export will include:</strong></p>
          <ul>
            <li>Contact information on file</li>
            <li>Repair history and estimate records</li>
            <li>Communication and message history</li>
            <li>Payment transaction summaries (amounts and dates, not full card details)</li>
            <li>Device photos (if still within retention period)</li>
          </ul>
          <p>
            To request a data export, email <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> with the subject line &ldquo;Data Export Request&rdquo;. Include your full name and Quote ID. We will provide your data in JSON or CSV format within 30 days.
          </p>

          <h3>Contact the privacy team</h3>
          <p>If you have questions about your data or want to exercise any of the rights described on this page, we are here to help:</p>
          <ul>
            <li><strong>Privacy Officer email:</strong> {LEGAL.privacyEmail}</li>
            {LEGAL.mailingAddress && <li><strong>Mailing address:</strong> {LEGAL.mailingAddress}</li>}
            <li><strong>Response time:</strong> Within 30 days of receiving your request</li>
          </ul>
          <p>
            For a complete overview of our data practices, please see our <a href='/privacy'>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </main>
  )
}
