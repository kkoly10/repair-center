export default function PrivacyPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Privacy policy</div>
          <h1>Privacy and device-handling policy</h1>
          <p>
            <strong>Effective date:</strong> March 31, 2026
          </p>
          <p>
            Repair Center (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your privacy. This policy explains what
            personal information we collect, how we use it, and how we protect it when you use
            our mail-in device repair service. By using our service, you agree to the collection
            and use of information in accordance with this policy.
          </p>

          <h3>1. Information we collect</h3>
          <p>We collect the following information when you submit an estimate request or use our service:</p>
          <ul>
            <li><strong>Contact information:</strong> Name, email address, and phone number</li>
            <li><strong>Device information:</strong> Device type, brand, model, issue description, condition details, and uploaded photos</li>
            <li><strong>Repair records:</strong> Estimate history, approval decisions, intake reports, repair status, technician notes, and shipment tracking</li>
            <li><strong>Payment information:</strong> Payment amounts, transaction IDs, and payment status (card details are processed securely by Stripe and never stored on our servers)</li>
            <li><strong>Communications:</strong> Messages exchanged between you and our repair team through the tracking page</li>
            <li><strong>Cookies and analytics data:</strong> We use cookies and similar technologies to maintain your session, remember preferences, and understand how our service is used</li>
            <li><strong>IP address:</strong> Collected automatically when you access our website for security and fraud prevention purposes</li>
            <li><strong>Device identifiers:</strong> Browser type, operating system, and unique device identifiers</li>
            <li><strong>Referring URLs:</strong> The web page that directed you to our service</li>
            <li><strong>Geolocation:</strong> Country-level location derived from your IP address</li>
          </ul>

          <h3>2. How we use your information</h3>
          <ul>
            <li>To review your estimate request and provide accurate repair pricing</li>
            <li>To communicate with you about estimate approval, repair status, payment, and return shipping</li>
            <li>To document device condition at intake and throughout the repair process</li>
            <li>To process payments and issue receipts</li>
            <li>To improve our service quality and repair operations</li>
            <li>To prevent fraud, abuse, and unauthorized access to our systems</li>
            <li>To comply with legal obligations, including tax reporting and dispute resolution</li>
            <li>To analyze and improve service performance, including page load times and feature usage</li>
            <li>To send marketing communications about new services, promotions, or updates (you may opt out at any time by clicking the unsubscribe link in any marketing email or contacting us directly)</li>
          </ul>

          <h3>3. Legal basis for processing</h3>
          <p>We process your personal information under the following legal bases:</p>
          <ul>
            <li><strong>Contract performance:</strong> Processing your repair requests, managing estimates, handling payments, and coordinating return shipment are necessary to fulfill our contract with you</li>
            <li><strong>Legitimate interests:</strong> We use your data to improve our services, prevent fraud, maintain security, and ensure the quality of our repair operations</li>
            <li><strong>Consent:</strong> We send marketing emails and promotional communications only with your consent. You may withdraw consent at any time</li>
            <li><strong>Legal compliance:</strong> We retain certain records (such as tax and payment records) as required by law, and may process data to comply with legal obligations or respond to lawful requests</li>
          </ul>

          <h3>4. Information sharing</h3>
          <p>We do not sell your personal information. We share data only with:</p>
          <ul>
            <li><strong>Payment processor (Stripe):</strong> To securely process deposits and final balance payments</li>
            <li><strong>Email provider (Resend):</strong> To send transactional notifications about your repair status</li>
            <li><strong>Shipping carriers:</strong> Your name and address as needed for return shipment</li>
            <li><strong>Law enforcement:</strong> We may disclose your information when required by law, subpoena, court order, or other legal process, or when we believe disclosure is necessary to protect our rights or the safety of others</li>
            <li><strong>Business transfers:</strong> In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control</li>
            <li><strong>Aggregated data:</strong> We may share aggregated, non-identifying data with partners or publicly for analytics, industry benchmarking, or service improvement purposes</li>
          </ul>

          <h3>5. Cookies and tracking</h3>
          <p>We use cookies and similar tracking technologies to operate and improve our service:</p>
          <ul>
            <li><strong>Essential cookies:</strong> Required for core functionality such as session management, authentication, and security. These cannot be disabled</li>
            <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website, which pages are most popular, and where users experience issues. This data is used to improve the service</li>
          </ul>
          <p>
            You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Please note that disabling essential cookies may prevent you from using certain features of our service, such as tracking your repair status.
          </p>

          <h3>6. Data retention</h3>
          <p>We retain your information for the following periods:</p>
          <ul>
            <li><strong>Repair records:</strong> Retained for 3 years after your last interaction with our service to support warranty claims and service history</li>
            <li><strong>Payment records:</strong> Retained for 7 years as required for tax reporting and legal compliance</li>
            <li><strong>Photos:</strong> Deleted 90 days after repair completion, unless a warranty claim is pending</li>
            <li><strong>Account data:</strong> Deleted upon request, subject to any legal holds or ongoing obligations</li>
          </ul>
          <p>
            After the applicable retention period expires, your data is securely deleted or anonymized.
          </p>

          <h3>7. International data transfers</h3>
          <p>
            Your information is processed and stored in the United States using Supabase cloud infrastructure. If you are located outside the United States, please be aware that your data will be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your jurisdiction.
          </p>
          <p>
            Where required, we rely on standard contractual clauses or other approved transfer mechanisms to ensure adequate protection of your data during international transfers.
          </p>

          <h3>8. Children&rsquo;s privacy</h3>
          <p>
            Our service is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us and we will promptly delete that information.
          </p>

          <h3>9. Device data and customer content</h3>
          <ul>
            <li>You are responsible for backing up your device before shipping it for repair</li>
            <li>We access only the minimum device functions needed to test or complete the requested repair</li>
            <li>We recommend removing SIM cards, memory cards, and other removable personal media before shipping</li>
            <li>We are not responsible for data loss that may occur during the repair process</li>
          </ul>

          <h3>10. Your privacy rights</h3>
          <p>Depending on your location, you may have specific rights regarding your personal information:</p>

          <p><strong>CCPA Rights (California residents)</strong></p>
          <ul>
            <li><strong>Right to know:</strong> You may request details about the categories and specific pieces of personal information we have collected about you</li>
            <li><strong>Right to delete:</strong> You may request that we delete your personal information, subject to certain exceptions</li>
            <li><strong>Right to opt out of sale:</strong> We do not sell your personal information. No opt-out action is required</li>
            <li><strong>Right to non-discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
          </ul>

          <p><strong>GDPR Rights (EU/EEA residents)</strong></p>
          <ul>
            <li><strong>Right to access:</strong> You may request a copy of the personal data we hold about you</li>
            <li><strong>Right to rectification:</strong> You may request correction of inaccurate or incomplete data</li>
            <li><strong>Right to erasure:</strong> You may request deletion of your personal data where there is no compelling reason for continued processing</li>
            <li><strong>Right to restrict processing:</strong> You may request that we limit how we use your data</li>
            <li><strong>Right to data portability:</strong> You may request a copy of your data in a structured, machine-readable format</li>
            <li><strong>Right to object:</strong> You may object to processing of your personal data based on legitimate interests or for direct marketing purposes</li>
          </ul>

          <p><strong>How to exercise your rights</strong></p>
          <ul>
            <li>Email us at <strong>privacy@repaircenter.example</strong></li>
            <li>Include your full name and Quote ID so we can locate your records</li>
            <li>We will respond to your request within 30 days</li>
          </ul>

          <h3>11. Security measures</h3>
          <ul>
            <li><strong>Encryption in transit:</strong> All data transmitted between your browser and our servers is protected using TLS (Transport Layer Security)</li>
            <li><strong>Encryption at rest:</strong> Stored data is encrypted at rest using industry-standard encryption algorithms</li>
            <li><strong>Access controls:</strong> We employ role-based access controls to ensure only authorized staff can access your information</li>
            <li>Repair photos, intake notes, and related records are stored in access-restricted systems</li>
            <li>Internal staff notes are kept separate from customer-visible updates</li>
            <li><strong>Regular security reviews:</strong> We conduct periodic reviews of our security practices and infrastructure</li>
            <li><strong>Incident response:</strong> We maintain incident response procedures to promptly address any security breaches and will notify affected users as required by law</li>
          </ul>

          <h3>12. Third-party services</h3>
          <p>We use the following third-party services to operate our repair platform. Each has its own privacy policy governing how they handle your data:</p>
          <ul>
            <li><strong>Stripe</strong> (payments) &ndash; <a href='https://stripe.com/privacy' target='_blank' rel='noopener noreferrer'>stripe.com/privacy</a></li>
            <li><strong>Resend</strong> (email) &ndash; <a href='https://resend.com/legal/privacy-policy' target='_blank' rel='noopener noreferrer'>resend.com/legal/privacy-policy</a></li>
            <li><strong>Twilio</strong> (SMS) &ndash; <a href='https://www.twilio.com/en-us/legal/privacy' target='_blank' rel='noopener noreferrer'>twilio.com/legal/privacy</a></li>
            <li><strong>Supabase</strong> (database) &ndash; <a href='https://supabase.com/privacy' target='_blank' rel='noopener noreferrer'>supabase.com/privacy</a></li>
            <li><strong>Vercel</strong> (hosting) &ndash; <a href='https://vercel.com/legal/privacy-policy' target='_blank' rel='noopener noreferrer'>vercel.com/legal/privacy-policy</a></li>
          </ul>

          <h3>13. Changes to this policy</h3>
          <p>
            We may update this policy from time to time. Material changes will be noted with an
            updated effective date at the top of this page. We encourage you to review this policy
            periodically. Your continued use of our service after changes are posted constitutes
            acceptance of the updated policy.
          </p>

          <h3>14. Contact information</h3>
          <p>For privacy-related questions or to exercise your privacy rights:</p>
          <ul>
            <li><strong>Privacy Officer email:</strong> privacy@repaircenter.example</li>
            <li><strong>Mailing address:</strong> 123 Repair Center Way, Suite 200, Fredericksburg, VA 22401</li>
            <li><strong>Response time:</strong> We will respond to all privacy inquiries within 30 days</li>
          </ul>
          <p>
            You may also reach us through the message thread on your tracking page.
          </p>
        </div>
      </div>
    </main>
  )
}