export default function PrivacyPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Privacy policy</div>
          <h1>Privacy and device-handling policy</h1>
          <p>
            <strong>Effective date:</strong> March 27, 2026
          </p>
          <p>
            Repair Center ("we", "us", "our") respects your privacy. This policy explains what
            personal information we collect, how we use it, and how we protect it when you use
            our mail-in device repair service.
          </p>

          <h3>1. Information we collect</h3>
          <p>We collect the following information when you submit an estimate request or use our service:</p>
          <ul>
            <li><strong>Contact information:</strong> Name, email address, and phone number</li>
            <li><strong>Device information:</strong> Device type, brand, model, issue description, condition details, and uploaded photos</li>
            <li><strong>Repair records:</strong> Estimate history, approval decisions, intake reports, repair status, technician notes, and shipment tracking</li>
            <li><strong>Payment information:</strong> Payment amounts, transaction IDs, and payment status (card details are processed securely by Stripe and never stored on our servers)</li>
            <li><strong>Communications:</strong> Messages exchanged between you and our repair team through the tracking page</li>
          </ul>

          <h3>2. How we use your information</h3>
          <ul>
            <li>To review your estimate request and provide accurate repair pricing</li>
            <li>To communicate with you about estimate approval, repair status, payment, and return shipping</li>
            <li>To document device condition at intake and throughout the repair process</li>
            <li>To process payments and issue receipts</li>
            <li>To improve our service quality and repair operations</li>
          </ul>

          <h3>3. Information sharing</h3>
          <p>We do not sell your personal information. We share data only with:</p>
          <ul>
            <li><strong>Payment processor (Stripe):</strong> To securely process deposits and final balance payments</li>
            <li><strong>Email provider (Resend):</strong> To send transactional notifications about your repair status</li>
            <li><strong>Shipping carriers:</strong> Your name and address as needed for return shipment</li>
          </ul>

          <h3>4. Device data and customer content</h3>
          <ul>
            <li>You are responsible for backing up your device before shipping it for repair</li>
            <li>We access only the minimum device functions needed to test or complete the requested repair</li>
            <li>We recommend removing SIM cards, memory cards, and other removable personal media before shipping</li>
            <li>We are not responsible for data loss that may occur during the repair process</li>
          </ul>

          <h3>5. Data storage and security</h3>
          <ul>
            <li>Repair photos, intake notes, and related records are stored in access-restricted systems</li>
            <li>Internal staff notes are kept separate from customer-visible updates</li>
            <li>We retain repair records for a reasonable period to support warranty claims and service history</li>
          </ul>

          <h3>6. Your rights</h3>
          <p>You may contact us to:</p>
          <ul>
            <li>Request a copy of the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your records (subject to legal and warranty obligations)</li>
          </ul>

          <h3>7. Contact</h3>
          <p>
            For privacy-related questions, contact us at the email address listed in your repair
            communications or through the message thread on your tracking page.
          </p>

          <h3>8. Changes to this policy</h3>
          <p>
            We may update this policy from time to time. Material changes will be noted with an
            updated effective date at the top of this page.
          </p>
        </div>
      </div>
    </main>
  )
}