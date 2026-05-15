import LegalDisclaimerBanner from '../../components/LegalDisclaimerBanner'

export default function ReturnsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <LegalDisclaimerBanner />
        <div className='policy-card'>
          <div className='kicker'>Returns & refund policy</div>
          <h1>Returns and refund policy</h1>
          <p>
            <strong>Effective date:</strong> March 31, 2026
          </p>

          <h3>1. Overview</h3>
          <p>
            We want you to be completely satisfied with our repair service. This policy explains
            what happens if you change your mind about a repair, your device cannot be repaired,
            or you are unhappy with the quality of work performed. Please review this policy
            before submitting your device for service.
          </p>

          <h3>2. Cancellation before mail-in</h3>
          <ul>
            <li>You may cancel your repair request at any time before shipping your device to us at no charge.</li>
            <li>If an inspection deposit was already paid, a full refund will be processed within 5-7 business days.</li>
            <li>To cancel, use the message thread on your tracking page or email us at the support address provided in your repair communications.</li>
          </ul>

          <h3>3. Cancellation after mail-in (device received)</h3>
          <ul>
            <li><strong>Repair not yet started:</strong> Your device will be returned and your deposit refunded minus a $15 inspection/handling fee. Return shipping is charged at the standard rate.</li>
            <li><strong>Inspection started:</strong> Your deposit will be refunded minus the actual inspection costs incurred (up to the deposit amount). Return shipping is charged at the standard rate.</li>
            <li><strong>Return shipping rates:</strong> $14.95 for phones and tablets, $24.95 for laptops.</li>
          </ul>

          <h3>4. Devices that cannot be repaired</h3>
          <ul>
            <li><strong>Beyond economical repair:</strong> If we determine that the cost of repair exceeds the value of the device, we will notify you. Your device will be returned, your deposit refunded minus a $15 inspection fee, and return shipping charged at the standard rate.</li>
            <li><strong>No fault found:</strong> If our inspection does not reproduce or identify the reported issue, your device will be returned with a report of our findings. Your deposit will be refunded minus a $15 inspection fee, and return shipping charged at the standard rate.</li>
            <li><strong>Parts unavailable:</strong> If the required parts are unavailable or discontinued, your device will be returned and your full deposit refunded. Return shipping is charged at the standard rate.</li>
          </ul>

          <h3>5. Dissatisfaction with repair quality</h3>
          <ul>
            <li>If you experience an issue related to our repair work, contact us within 90 days of receiving your device back (the warranty period).</li>
            <li>We will re-repair the device at no additional cost if the issue is related to the original work we performed.</li>
            <li>If a re-repair is not possible or the issue persists after a second attempt, we may issue a partial or full refund of the repair charges at our discretion.</li>
            <li>Cosmetic complaints such as minor scratches from disassembly or reassembly are evaluated on a case-by-case basis and do not automatically qualify for a refund.</li>
          </ul>

          <h3>6. Revised estimate declined</h3>
          <ul>
            <li>If inspection reveals additional issues and a revised estimate is issued, you are free to decline the revised estimate.</li>
            <li>Your device will be returned in its current condition.</li>
            <li>Your original deposit will be refunded minus a $15 inspection fee.</li>
            <li>Return shipping is charged at the standard rate.</li>
          </ul>

          <h3>7. Refund methods</h3>
          <ul>
            <li>All refunds are issued to the original payment method used at checkout (processed via Stripe).</li>
            <li>Refunds are typically processed within 5-7 business days after approval. Depending on your bank or card issuer, it may take an additional few days for the refund to appear on your statement.</li>
            <li>A refund confirmation email will be sent to the address on file once the refund has been initiated.</li>
          </ul>

          <h3>8. Non-refundable items</h3>
          <ul>
            <li><strong>Return shipping fees</strong> once your device has been shipped back to you.</li>
            <li><strong>Express service add-on</strong> if the repair was completed under the express timeline.</li>
            <li><strong>Data backup service</strong> once the backup has been performed.</li>
            <li><strong>Screen protector installation</strong> once applied to the device.</li>
          </ul>

          <h3>9. Damaged in transit</h3>
          <ul>
            <li><strong>Inbound shipping:</strong> We photograph and document every device upon arrival at our facility. If you believe your device was damaged during inbound shipping, contact your shipping carrier directly to file a claim. We strongly recommend purchasing shipping insurance when sending your device.</li>
            <li><strong>Return shipping:</strong> If your device arrives damaged after we ship it back to you, contact us immediately. We will file a claim with the carrier on your behalf and work with you to reach a resolution.</li>
          </ul>

          <h3>10. How to request a refund</h3>
          <ul>
            <li>Send a message through the tracking page message thread associated with your repair.</li>
            <li>Alternatively, email us at the support address provided in your repair communications.</li>
            <li>Include your Quote ID or Order Number so we can locate your repair quickly.</li>
            <li>We respond to all refund requests within 1-2 business days.</li>
          </ul>

          <h3>11. Right to modify this policy</h3>
          <p>
            We may update this policy from time to time. The effective date at the top of this page
            indicates when the policy was last revised. Continued use of the service after changes
            constitutes acceptance of the updated policy. We encourage you to review this page
            periodically.
          </p>
        </div>
      </div>
    </main>
  )
}
