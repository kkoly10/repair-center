import { LEGAL } from '../../lib/legalConfig'
import LegalDisclaimerBanner from '../../components/LegalDisclaimerBanner'

export const metadata = {
  title: 'Privacy Policy — RepairCenter',
  description:
    'How RepairCenter, the SaaS platform, and the repair shops on the platform handle your personal information.',
}

export default function PrivacyPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <LegalDisclaimerBanner />
        <div className='policy-card'>
          <div className='kicker'>Privacy policy</div>
          <h1>Privacy Policy</h1>
          <p>
            <strong>Effective date:</strong> May 14, 2026
          </p>

          <h3>1. About RepairCenter and your repair shop</h3>
          <p>
            RepairCenter (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a software-as-a-service platform
            used by independent repair shops. When you submit a repair request through a shop page
            on our platform:
          </p>
          <ul>
            <li>
              <strong>The repair shop</strong> is the &ldquo;business&rdquo; / &ldquo;controller&rdquo;
              of your personal information for the purposes of running the repair. The shop decides
              what to do with your information, contacts you, and is responsible for honoring
              applicable customer privacy requests.
            </li>
            <li>
              <strong>RepairCenter</strong> is the &ldquo;service provider&rdquo; / &ldquo;processor&rdquo;
              for the shop&apos;s data. We process the data on the shop&apos;s behalf so they can
              run their repair business. We do not sell customer data and we do not use it for our
              own marketing.
            </li>
          </ul>
          <p>
            This policy describes how RepairCenter handles information across the platform. Each
            shop may have its own additional notice; check the shop&apos;s page for details.
          </p>

          <h3>2. Information collected through the platform</h3>
          <p>Depending on how you interact with the platform, the following categories may be collected:</p>
          <ul>
            <li><strong>Shop account data.</strong> Shop name, logo, branding settings, receiving address, payment settings, billing contact.</li>
            <li><strong>Staff user data.</strong> Staff name, email, role, and authentication metadata for users you invite to your shop.</li>
            <li><strong>Customer contact data.</strong> Customer name, email address, and phone number.</li>
            <li><strong>Device and repair data.</strong> Device type, brand, model, issue description, condition answers, intake notes, repair status, technician notes (where applicable).</li>
            <li><strong>Uploaded photos.</strong> Photos of the device condition submitted with an estimate request or taken at intake.</li>
            <li><strong>Messages.</strong> Messages exchanged between the customer and the shop through the tracking page.</li>
            <li><strong>Appointment data.</strong> Booking name, email, phone, preferred date/time, and notes if the customer used the appointment form.</li>
            <li><strong>Payment metadata.</strong> Payment amounts, transaction IDs, status, and payment method type. Full card numbers are never stored on our servers; they are handled by Stripe.</li>
            <li><strong>Reviews.</strong> Rating, optional comment, and the quote a review was associated with.</li>
            <li><strong>Analytics and logs.</strong> Page views, feature usage, IP address, browser/user-agent, country-level location derived from IP, referring URLs, and error logs used for security and product improvement.</li>
          </ul>

          <h3>3. How the platform uses information</h3>
          <ul>
            <li>To provide the platform features that the shop has chosen to use.</li>
            <li>To route repair requests, estimates, messages, and notifications between the shop and its customers.</li>
            <li>To send transactional emails and SMS notifications (status updates, estimate ready, payment requests, review requests, warranty reminders).</li>
            <li>To process payments — both the shop&apos;s monthly subscription to RepairCenter and (if enabled) repair payments from the shop&apos;s customers.</li>
            <li>To prevent abuse, fraud, and unauthorized access (rate limiting, error logging, IP capture).</li>
            <li>To improve and debug the platform (aggregate analytics, error reporting).</li>
            <li>To comply with legal obligations and respond to lawful requests.</li>
          </ul>
          <p>
            We do not use customer data to train models, do not sell it to third parties, and do
            not use it for marketing other than transactional communications.
          </p>

          <h3>4. Information sharing</h3>
          <p>
            We do not sell personal information. We share information only in the following ways:
          </p>
          <ul>
            <li>
              <strong>The repair shop.</strong> When you submit a quote, appointment, or review to
              a shop, that information is shared with the shop. The shop accesses it through the
              admin dashboard.
            </li>
            <li>
              <strong>Sub-processors.</strong> We use the following sub-processors to run the
              platform. Each has its own privacy policy:
              <ul>
                <li><strong>Supabase</strong> — database, file storage, authentication. <a href='https://supabase.com/privacy' target='_blank' rel='noopener noreferrer'>supabase.com/privacy</a></li>
                <li><strong>Stripe</strong> — payment processing (subscriptions and, optionally, repair payments). <a href='https://stripe.com/privacy' target='_blank' rel='noopener noreferrer'>stripe.com/privacy</a></li>
                <li><strong>Resend</strong> — transactional email. <a href='https://resend.com/legal/privacy-policy' target='_blank' rel='noopener noreferrer'>resend.com/legal/privacy-policy</a></li>
                <li><strong>Twilio</strong> — transactional SMS (if enabled by the shop). <a href='https://www.twilio.com/en-us/legal/privacy' target='_blank' rel='noopener noreferrer'>twilio.com/legal/privacy</a></li>
                <li><strong>Vercel</strong> — application hosting. <a href='https://vercel.com/legal/privacy-policy' target='_blank' rel='noopener noreferrer'>vercel.com/legal/privacy-policy</a></li>
              </ul>
            </li>
            <li>
              <strong>Shipping carriers.</strong> If you ship a device, the shop shares your name
              and address with the carrier of its choice.
            </li>
            <li>
              <strong>Legal obligations.</strong> We may disclose information when required by law,
              subpoena, court order, or to protect rights or safety.
            </li>
            <li>
              <strong>Business transfers.</strong> In the event of a merger, acquisition, or sale
              of assets, information may transfer with the platform. We will give reasonable
              notice if that happens.
            </li>
            <li>
              <strong>Aggregated data.</strong> Aggregated, de-identified data may be used for
              analytics, benchmarking, or product improvement.
            </li>
          </ul>

          <h3>5. Cookies and tracking</h3>
          <ul>
            <li><strong>Essential cookies.</strong> Used for session management, authentication, and security. These cannot be disabled without breaking the platform.</li>
            <li><strong>Analytics.</strong> We may use lightweight analytics to understand which pages and features are used. We do not run third-party ad-targeting trackers on the platform today.</li>
          </ul>
          <p>
            You can clear or block cookies through your browser. Blocking essential cookies may
            prevent you from signing in or tracking a repair.
          </p>

          <h3>6. Data retention</h3>
          <p>
            We retain information for as long as the shop&apos;s account is active and for a
            reasonable period after, to support warranty inquiries, dispute resolution, fraud
            prevention, and legal compliance. Specific retention targets:
          </p>
          <ul>
            <li><strong>Active customer repair records:</strong> retained while the shop is an active customer of the platform, plus a reasonable post-termination period.</li>
            <li><strong>Payment records:</strong> retained for at least the period required by tax and accounting law (typically 7 years in the US).</li>
            <li><strong>Photos:</strong> the shop controls how long photos are kept. They may be deleted by the shop or after the shop&apos;s account terminates.</li>
            <li><strong>Backups and logs:</strong> retained for shorter periods (typically up to 30 days for security logs, longer for audit logs).</li>
          </ul>
          <p>
            On request from a shop, we can delete or export customer data subject to legal holds
            and ongoing obligations.
          </p>

          <h3>7. International transfers</h3>
          <p>
            The platform is hosted in the United States. If you are outside the US, your
            information will be transferred to and processed in the US, where data protection laws
            differ from your home jurisdiction. Where required, we rely on standard contractual
            clauses or other approved mechanisms.
          </p>

          <h3>8. Children&apos;s privacy</h3>
          <p>
            The platform is not directed at children under 13. We do not knowingly collect
            personal information from children under 13. If you believe a child has provided
            personal information, contact us and we will work with the relevant shop to delete it.
          </p>

          <h3>9. Device data</h3>
          <ul>
            <li>You are responsible for backing up your device before shipping it to a shop.</li>
            <li>The shop accesses only the minimum device functions needed to test or complete the requested repair.</li>
            <li>We recommend removing SIM cards, memory cards, and removable personal media before shipping.</li>
            <li>Neither the shop nor RepairCenter is responsible for data loss during the repair process unless the shop&apos;s own policy says so.</li>
          </ul>

          <h3>10. Your privacy rights</h3>
          <p>
            Depending on where you live, you may have specific rights regarding your personal
            information. Whether and how these rights apply depends on each shop&apos;s thresholds
            and on RepairCenter&apos;s own thresholds. We summarize the most common rights below.
          </p>

          <p><strong>California (CCPA / CPRA).</strong> California residents may have the right to know what categories and specific pieces of personal information are collected, to request deletion, to correct inaccurate information, to opt out of sale or sharing (we do not sell personal information), to limit use of sensitive personal information, and to non-discrimination for exercising rights.</p>

          <p><strong>Virginia (VCDPA).</strong> Virginia residents may have rights to access, correct, delete, port, and opt out of targeted advertising or sale of personal data.</p>

          <p><strong>Other US state laws.</strong> Colorado, Connecticut, Utah, and other states have similar laws with comparable rights. Coverage depends on the specific law and on whether the business meets that state&apos;s thresholds.</p>

          <p><strong>EU / UK (GDPR / UK GDPR).</strong> Where applicable, EU/UK residents may have the rights of access, rectification, erasure, restriction, portability, and objection. Where we are the processor and a shop is the controller, we will reasonably cooperate with the shop to respond.</p>

          <p><strong>How to exercise these rights.</strong></p>
          <ul>
            <li>For requests about your data at a specific shop, contact the shop directly through the message thread on your tracking page or the email on the shop&apos;s page.</li>
            <li>For requests about RepairCenter&apos;s platform-level processing, email <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.</li>
            <li>Include enough information to verify your identity (e.g. your Quote ID, the email on file, the shop name).</li>
            <li>We will respond within the timeframe the applicable law requires (typically 30–45 days).</li>
          </ul>
          <p>
            Whether the threshold to formally apply CCPA, VCDPA, GDPR, or another regime to
            RepairCenter or to a specific shop has been met is a fact-specific question. We try to
            honor reasonable requests regardless.
          </p>

          <h3>11. Security</h3>
          <ul>
            <li><strong>Encryption in transit:</strong> all traffic is over TLS.</li>
            <li><strong>Encryption at rest:</strong> stored data is encrypted at rest by our database provider.</li>
            <li><strong>Access controls:</strong> shop data is isolated using row-level security on every table. Staff users only see their own shop&apos;s data.</li>
            <li><strong>Logging:</strong> sensitive operations write audit log entries.</li>
            <li><strong>Incident response:</strong> we maintain incident response procedures and will notify affected users and shops as required by law.</li>
          </ul>

          <h3>12. Shops with their own privacy obligations</h3>
          <p>
            If your shop is required by law to post its own privacy notice (for example because of
            volume or jurisdiction), the shop is responsible for doing so. This platform policy is
            not a substitute for a shop&apos;s own notice where one is required.
          </p>

          <h3>13. Changes to this policy</h3>
          <p>
            We may update this policy from time to time. Material changes will be noted with an
            updated effective date at the top of this page. We encourage you to review this policy
            periodically.
          </p>

          <h3>14. Contact</h3>
          <p>
            For privacy-related questions or to exercise your rights at the platform level:
          </p>
          <ul>
            <li>Email: <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a></li>
            {LEGAL.mailingAddress && <li>Mailing address: {LEGAL.mailingAddress}</li>}
            <li>Response time: we aim to respond within 30 days, or the timeframe required by law.</li>
          </ul>
          <p>
            For privacy questions about a specific shop and the repair you submitted to them,
            contact the shop directly through the message thread on your tracking page.
          </p>
        </div>
      </div>
    </main>
  )
}
