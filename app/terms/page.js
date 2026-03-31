export default function TermsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Terms of service</div>
          <h1>Terms of service</h1>
          <p>
            <strong>Effective date:</strong> March 31, 2026
          </p>
          <p>
            By submitting an estimate request or using Repair Center&apos;s mail-in repair service,
            you agree to the following terms. Please read them carefully before shipping your device.
          </p>

          <h3>1. Acceptance of terms</h3>
          <p>
            By accessing our website, submitting an estimate request, or using any part of our repair
            service, you agree to be bound by these Terms of Service, our{' '}
            <a href='/privacy'>Privacy Policy</a>, and our{' '}
            <a href='/returns'>Returns &amp; Refund Policy</a>. If you do not agree to these terms,
            do not use our service.
          </p>

          <h3>2. Service description</h3>
          <p>
            Repair Center provides mail-in repair services for consumer electronics including phones,
            tablets, and laptops. Our service includes:
          </p>
          <ul>
            <li>Free online estimates based on device information and photos you provide</li>
            <li>Professional diagnosis and repair at our facility</li>
            <li>Secure return shipping of repaired devices</li>
            <li>Limited warranty on completed repairs</li>
          </ul>

          <h3>3. Estimates and pricing</h3>
          <ul>
            <li>Photo-based estimates are preliminary. They reflect our best assessment based on the information you provide, but are not a binding price guarantee.</li>
            <li>Final pricing may change after in-hand inspection if the actual device condition differs from what was submitted (e.g., hidden damage, liquid exposure, or additional parts needed).</li>
            <li>If the price changes, we will send you a revised estimate for approval before proceeding with the repair.</li>
            <li>No repair work begins without your explicit approval of the applicable estimate.</li>
            <li>Estimates expire 14 days after they are sent. Expired estimates require a new submission.</li>
            <li>Prices do not include optional add-on services (data backup, express service, screen protector) unless explicitly selected.</li>
          </ul>

          <h3>4. Mail-in and inspection</h3>
          <ul>
            <li>You are responsible for packaging your device securely and following the mail-in instructions provided after approval.</li>
            <li>Repair Center is not liable for damage that occurs during inbound shipping due to inadequate packaging.</li>
            <li>We recommend insuring your inbound shipment for the full value of the device.</li>
            <li>Upon receipt, we inspect the device and document its condition with photos. Inspection may confirm the original estimate, narrow the issue, or reveal additional damage.</li>
            <li>If inspection changes the repair scope, a revised estimate will be issued. You may approve the revised estimate or decline and have the device returned.</li>
          </ul>

          <h3>5. Payments</h3>
          <ul>
            <li>An inspection deposit is required before we begin work. The deposit amount varies by device type ($25 for phones and tablets, $45 for laptops). The deposit is credited toward your final bill.</li>
            <li>The remaining balance must be paid before we ship the repaired device back to you.</li>
            <li>All payments are processed securely through Stripe. We do not store your card details.</li>
            <li>Accepted payment methods include all major credit and debit cards.</li>
            <li>Refund terms are detailed in our <a href='/returns'>Returns &amp; Refund Policy</a>.</li>
          </ul>

          <h3>6. Warranty</h3>
          <ul>
            <li><strong>Standard warranty:</strong> Completed repairs include a 90-day limited warranty covering parts and labor for the specific work performed.</li>
            <li><strong>Software repairs:</strong> Software-related repairs carry a 30-day warranty.</li>
            <li><strong>Extended warranty:</strong> Optional extended (180-day) and premium (365-day) warranty plans are available for purchase at the time of estimate approval.</li>
            <li>The warranty does not cover: unrelated device failures, physical damage after return, liquid damage after return, issues caused by third-party modifications, or normal wear and tear.</li>
            <li>Warranty coverage begins on the date the repaired device is delivered back to you.</li>
            <li>To make a warranty claim, contact us through the tracking page message thread or via email with your Quote ID or Order Number.</li>
          </ul>

          <h3>7. Customer responsibilities</h3>
          <ul>
            <li><strong>Data backup:</strong> Back up all data on your device before shipping. We are not responsible for data loss during the repair process, even if you purchase our data backup add-on service.</li>
            <li><strong>Remove personal items:</strong> Remove SIM cards, memory cards, cases, and screen protectors before shipping unless instructed otherwise.</li>
            <li><strong>Disable security locks:</strong> Disable Find My Device / Activation Lock / screen passcodes before shipping. Locked devices may be returned unrepaired and the deposit may be forfeited.</li>
            <li><strong>Accurate information:</strong> Provide accurate and complete information about your device condition. Failure to disclose known issues (especially liquid damage) may affect your estimate and warranty coverage.</li>
          </ul>

          <h3>8. Devices that cannot be repaired</h3>
          <ul>
            <li><strong>Beyond economical repair:</strong> If inspection determines the repair cost would exceed the device&apos;s value, we will notify you and offer to return it. See our <a href='/returns'>Returns &amp; Refund Policy</a> for deposit refund terms.</li>
            <li><strong>No fault found:</strong> If no fault is found during inspection, the device will be returned with a report of our findings.</li>
            <li><strong>Parts unavailable:</strong> If required parts are unavailable, we will notify you and return the device with a full deposit refund.</li>
          </ul>

          <h3>9. Intellectual property</h3>
          <p>
            All content on our website, including text, graphics, logos, and software, is the property
            of Repair Center and is protected by applicable intellectual property laws. You may not
            reproduce, distribute, or create derivative works from our content without written permission.
          </p>

          <h3>10. Limitation of liability</h3>
          <ul>
            <li>Repair Center&apos;s total liability for any claim arising from our service is limited to the amount you paid for the specific repair in question.</li>
            <li>We are not liable for indirect, incidental, special, or consequential damages including but not limited to lost data, lost revenue, device downtime, or emotional distress.</li>
            <li>We are not liable for pre-existing conditions, undisclosed damage, or issues unrelated to the repair we performed.</li>
            <li>Some jurisdictions do not allow limitation of liability for certain damages. In such cases, our liability is limited to the maximum extent permitted by law.</li>
          </ul>

          <h3>11. Indemnification</h3>
          <p>
            You agree to indemnify and hold harmless Repair Center, its officers, employees, and agents
            from any claims, damages, losses, or expenses (including reasonable attorney&apos;s fees) arising
            from your use of our service, your violation of these terms, or your violation of any
            third-party rights.
          </p>

          <h3>12. Dispute resolution</h3>
          <ul>
            <li><strong>Informal resolution:</strong> We encourage you to contact us first to resolve any disputes informally. Most issues can be resolved through our tracking page message thread or by email.</li>
            <li><strong>Governing law:</strong> These terms are governed by the laws of the Commonwealth of Virginia, without regard to conflict of law principles.</li>
            <li><strong>Jurisdiction:</strong> Any disputes not resolved informally shall be subject to the exclusive jurisdiction of the courts in Fredericksburg, Virginia.</li>
          </ul>

          <h3>13. Service availability</h3>
          <ul>
            <li>We reserve the right to refuse service, modify pricing, or discontinue any service at our discretion.</li>
            <li>We do not guarantee uninterrupted availability of our website or services.</li>
            <li>Turnaround times are estimates and not guaranteed. Delays may occur due to parts availability, shipping, or high repair volume.</li>
          </ul>

          <h3>14. Promotional offers and discounts</h3>
          <ul>
            <li>Promo codes and discounts are subject to specific terms and conditions stated at the time of offer.</li>
            <li>Promo codes cannot be combined unless explicitly stated.</li>
            <li>We reserve the right to modify or cancel promotional offers at any time.</li>
            <li>Returning customer loyalty discounts are applied automatically and cannot be combined with other percentage-based discounts.</li>
          </ul>

          <h3>15. Changes to these terms</h3>
          <p>
            We may update these terms from time to time. The effective date at the top of this page
            indicates when the terms were last revised. Continued use of the service after changes
            constitutes acceptance of the updated terms. Material changes will be communicated via
            email to customers with active repairs.
          </p>

          <h3>16. Contact</h3>
          <p>
            For questions about these terms, contact us at the email address listed in your repair
            communications, through the message thread on your tracking page, or by mail at:
          </p>
          <p>
            <strong>Repair Center</strong><br />
            123 Repair Center Way, Suite 200<br />
            Fredericksburg, VA 22401
          </p>
        </div>
      </div>
    </main>
  )
}
