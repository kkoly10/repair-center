export default function TermsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Terms of service</div>
          <h1>Terms of service</h1>
          <p>
            <strong>Effective date:</strong> March 27, 2026
          </p>
          <p>
            By submitting an estimate request or using Repair Center's mail-in repair service,
            you agree to the following terms. Please read them carefully before shipping your device.
          </p>

          <h3>1. Estimates and pricing</h3>
          <ul>
            <li>Photo-based estimates are preliminary. They reflect our best assessment based on the information you provide, but are not a binding price guarantee.</li>
            <li>Final pricing may change after in-hand inspection if the actual device condition differs from what was submitted (e.g., hidden damage, liquid exposure, or additional parts needed).</li>
            <li>If the price changes, we will send you a revised estimate for approval before proceeding with the repair.</li>
            <li>No repair work begins without your explicit approval of the applicable estimate.</li>
            <li>Estimates expire 14 days after they are sent. Expired estimates require a new submission.</li>
          </ul>

          <h3>2. Mail-in and inspection</h3>
          <ul>
            <li>You are responsible for packaging your device securely and following the mail-in instructions provided after approval.</li>
            <li>Repair Center is not liable for damage that occurs during inbound shipping due to inadequate packaging.</li>
            <li>Upon receipt, we inspect the device and document its condition. Inspection may confirm the original estimate, narrow the issue, or reveal additional damage.</li>
            <li>If inspection changes the repair scope, a revised estimate will be issued. You may approve the revised estimate or decline and have the device returned.</li>
          </ul>

          <h3>3. Payments</h3>
          <ul>
            <li>An inspection deposit may be required before we begin work, depending on the repair type. The deposit is credited toward your final bill.</li>
            <li>The remaining balance must be paid before we ship the repaired device back to you.</li>
            <li>All payments are processed securely through Stripe. We do not store your card details.</li>
            <li>Refunds for deposits are handled on a case-by-case basis. If we determine the device cannot be repaired, your deposit may be refunded minus any applicable inspection fees.</li>
          </ul>

          <h3>4. Warranty</h3>
          <ul>
            <li>Completed repairs include a limited warranty covering the specific work performed, as stated on your estimate (typically 90 days).</li>
            <li>The warranty does not cover unrelated device failures, physical damage after return, liquid damage, or issues caused by third-party modifications.</li>
            <li>To make a warranty claim, contact us through the tracking page message thread or the email address in your repair communications.</li>
          </ul>

          <h3>5. Customer responsibilities</h3>
          <ul>
            <li>Back up all data on your device before shipping. We are not responsible for data loss during the repair process.</li>
            <li>Remove SIM cards, memory cards, cases, and screen protectors before shipping unless instructed otherwise.</li>
            <li>Disable Find My Device / Activation Lock before shipping. Locked devices may be returned unrepaired.</li>
          </ul>

          <h3>6. Devices that cannot be repaired</h3>
          <ul>
            <li>If inspection determines the device is beyond economical repair, we will notify you and offer to return it at a flat-rate return shipping fee.</li>
            <li>If no fault is found during inspection, the device will be returned with a report of our findings.</li>
          </ul>

          <h3>7. Limitation of liability</h3>
          <ul>
            <li>Repair Center's total liability for any claim arising from our service is limited to the amount you paid for the repair.</li>
            <li>We are not liable for indirect, incidental, or consequential damages including lost data, lost revenue, or device downtime.</li>
          </ul>

          <h3>8. Changes to these terms</h3>
          <p>
            We may update these terms from time to time. The effective date at the top of this page
            indicates when the terms were last revised. Continued use of the service after changes
            constitutes acceptance of the updated terms.
          </p>
        </div>
      </div>
    </main>
  )
}