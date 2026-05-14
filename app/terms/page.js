export const metadata = {
  title: 'Terms of Service — RepairCenter',
  description:
    'Customer-facing terms explaining the platform, the repair shop, and your responsibilities when you submit a repair through RepairCenter.',
}

export default function TermsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Terms of service</div>
          <h1>Terms of Service</h1>
          <p>
            <strong>Effective date:</strong> May 14, 2026
          </p>
          <p>
            These terms apply when you (the customer) submit a repair request through a shop page
            hosted on the RepairCenter platform. Please read them carefully.
          </p>

          <h3>1. Who you are dealing with</h3>
          <p>
            When you submit a repair request through a shop page on this platform, three parties
            are involved:
          </p>
          <ul>
            <li>
              <strong>RepairCenter (the platform).</strong> RepairCenter provides software —
              estimate forms, tracking pages, messaging, appointment booking, payment tools, and
              the admin dashboard the shop uses to run its repair business.
            </li>
            <li>
              <strong>The repair shop.</strong> The shop is the independent business listed on
              the shop page where you submitted your request. The shop is responsible for
              diagnosing, repairing, shipping, and warrantying your device.
            </li>
            <li>
              <strong>You (the customer).</strong> You are submitting a device for repair to that
              shop. You are responsible for the information you provide, for backing up your
              device, and for reviewing the shop&apos;s policies before mailing or dropping it off.
            </li>
          </ul>

          <h3>2. RepairCenter is not the repair provider</h3>
          <p>
            Unless a shop page explicitly identifies RepairCenter itself as the shop, RepairCenter
            does not perform repairs, does not set pricing, does not own the parts used, and does
            not control the shop&apos;s warranty terms. We provide the platform that lets the shop
            offer those services to you.
          </p>
          <p>
            For more on the platform / shop / customer relationship, see our{' '}
            <a href='/shop-responsibility'>Shop Responsibility</a> page.
          </p>

          <h3>3. Estimates and pricing</h3>
          <ul>
            <li>
              Photo-based estimates are preliminary. They reflect the shop&apos;s best assessment
              based on the information you provide and are not a binding price guarantee.
            </li>
            <li>
              Final pricing may change after in-hand inspection if the actual device condition
              differs from what was submitted (e.g., hidden damage, liquid exposure, or additional
              parts needed).
            </li>
            <li>
              If the price changes, the shop will send you a revised estimate for approval before
              proceeding with the repair.
            </li>
            <li>
              No repair work begins without your explicit approval of the applicable estimate.
            </li>
            <li>
              Pricing, estimate expiry, and add-on options are set by the shop. Review the shop
              page for the specific terms that apply.
            </li>
          </ul>

          <h3>4. Mail-in and shipping</h3>
          <ul>
            <li>
              You are responsible for packaging your device securely and following the mail-in
              instructions the shop provides.
            </li>
            <li>
              Neither the shop nor RepairCenter is liable for damage that occurs during inbound
              shipping due to inadequate packaging.
            </li>
            <li>
              We recommend insuring your inbound shipment for the full value of the device.
            </li>
            <li>
              Upon receipt, the shop typically inspects the device and documents its condition.
              If inspection changes the repair scope, the shop will issue a revised estimate.
            </li>
            <li>
              Return shipping cost, carrier, and timing are set by the shop and listed in the
              mail-in instructions.
            </li>
          </ul>

          <h3>5. Payments</h3>
          <ul>
            <li>
              The shop sets the pricing, the deposit policy, and the accepted payment methods. The
              shop is the seller and the merchant of record for repair payments.
            </li>
            <li>
              If you pay online through Stripe, Stripe processes the payment on the shop&apos;s
              behalf. If the shop uses manual payment mode, you will see the shop&apos;s payment
              instructions on the estimate-review page (e.g. Cash App, Zelle, Square, cash on
              pickup).
            </li>
            <li>
              RepairCenter does not collect or hold repair payments and is not responsible for
              refunds, chargebacks, or payment disputes between you and the shop. Contact the shop
              directly for refund or dispute requests.
            </li>
          </ul>

          <h3>6. Warranty</h3>
          <ul>
            <li>
              The warranty on your repair is offered by the shop, not by RepairCenter. Warranty
              length, scope, and exclusions are set by the shop.
            </li>
            <li>
              Review the shop&apos;s estimate, intake report, or shop page for the warranty terms
              that apply to your repair.
            </li>
            <li>
              RepairCenter does not provide a platform-backed repair warranty.
            </li>
          </ul>

          <h3>7. Your responsibilities</h3>
          <ul>
            <li>
              <strong>Data backup.</strong> Back up all data on your device before shipping or
              dropping it off. Repair work may result in data loss, even when the shop takes care.
              The shop is not responsible for data loss unless the shop&apos;s policy says so.
              RepairCenter is not responsible for data loss in any case.
            </li>
            <li>
              <strong>Remove personal items.</strong> Remove SIM cards, memory cards, cases, and
              screen protectors before shipping unless the shop instructs otherwise.
            </li>
            <li>
              <strong>Disable security locks.</strong> Disable Find My Device / Activation Lock /
              screen passcodes unless the shop&apos;s instructions say to leave them on. A locked
              device may be returned unrepaired and any deposit may be forfeited per the
              shop&apos;s policy.
            </li>
            <li>
              <strong>Accurate information.</strong> Provide accurate information about your
              device condition. Failure to disclose known issues (especially liquid damage) may
              affect your estimate, repair, and warranty.
            </li>
          </ul>

          <h3>8. Devices that cannot be repaired</h3>
          <ul>
            <li>
              <strong>Beyond economical repair.</strong> If the shop determines the repair cost
              exceeds the device&apos;s value, the shop will notify you. Deposit refund terms are
              set by the shop.
            </li>
            <li>
              <strong>No fault found.</strong> If no fault is identified, the shop will return the
              device with a report of findings.
            </li>
            <li>
              <strong>Parts unavailable.</strong> If required parts are unavailable, the shop will
              notify you and follow its return policy.
            </li>
          </ul>

          <h3>9. Reviews</h3>
          <p>
            After your repair ships, you may receive a request to leave a review. Participation is
            entirely optional. You are free to rate any number of stars, leave a comment, or
            decline to respond. Reviews are not screened for sentiment — your honest feedback is
            welcome. We comply with the FTC&apos;s Consumer Reviews and Testimonials Rule and do
            not offer incentives in exchange for positive reviews.
          </p>

          <h3>10. Customer accounts</h3>
          <p>
            You may sign in to a shop&apos;s page with a magic email link to see all of your
            repairs at that shop in one place. Signing in is optional. You can also continue to
            track an individual repair by entering your Quote ID and email.
          </p>

          <h3>11. Intellectual property</h3>
          <p>
            The RepairCenter platform, its software, and its branding are owned by RepairCenter.
            The repair shop&apos;s branding, logos, and content shown on a shop page belong to
            that shop. You may not reproduce or redistribute either without permission.
          </p>

          <h3>12. Limitation of liability (platform)</h3>
          <ul>
            <li>
              RepairCenter&apos;s total liability to you under these terms is limited to the
              amount you have paid RepairCenter directly (if any). Most customers pay the repair
              shop, not RepairCenter, so this amount is usually zero.
            </li>
            <li>
              RepairCenter is not liable for repair outcomes, parts costs, shipping damage, device
              data loss, or customer service failures by the shop.
            </li>
            <li>
              The shop sets its own limitation of liability for the repair work; consult the
              shop&apos;s policies directly.
            </li>
            <li>
              Some jurisdictions do not allow these limitations; in those jurisdictions, the
              limits apply to the maximum extent permitted by law.
            </li>
          </ul>

          <h3>13. Dispute resolution</h3>
          <ul>
            <li>
              <strong>Repair disputes.</strong> Contact the shop directly. RepairCenter cannot
              resolve repair pricing, repair quality, or refund disputes between you and the shop.
            </li>
            <li>
              <strong>Platform disputes.</strong> For disputes about the platform itself, contact
              us via the email on the <a href='/contact'>contact page</a>. Most issues can be
              resolved informally.
            </li>
            <li>
              <strong>Governing law.</strong> These terms are governed by the laws of the
              Commonwealth of Virginia, without regard to conflict-of-law principles.
            </li>
          </ul>

          <h3>14. Operator-run repair shop (if applicable)</h3>
          <p>
            If the operator of the RepairCenter platform also runs a repair shop using this
            software, that shop&apos;s own terms — including pricing, warranty, refund, and
            shipping terms — apply separately to repairs you submit to it. Look on that specific
            shop&apos;s page for its terms.
          </p>

          <h3>15. Changes to these terms</h3>
          <p>
            We may update these terms from time to time. The effective date at the top of this
            page indicates when the terms were last revised. Continued use of the service after
            changes constitutes acceptance.
          </p>

          <h3>16. Contact</h3>
          <p>
            Platform-related questions: see the <a href='/contact'>contact page</a>. <br />
            Repair-specific questions: contact the shop directly through the message thread on
            your tracking page.
          </p>
        </div>
      </div>
    </main>
  )
}
