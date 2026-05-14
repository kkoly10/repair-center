export const metadata = {
  title: 'Shop Responsibility & Repair Disclaimer — RepairCenter',
  description:
    'How RepairCenter (the software) and your repair shop (the business) split responsibility for your repair.',
}

export default function ShopResponsibilityPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Shop responsibility</div>
          <h1>Shop Responsibility &amp; Repair Disclaimer</h1>
          <p>
            <strong>Effective date:</strong> May 14, 2026
          </p>

          <h3>The short version</h3>
          <p>
            <strong>RepairCenter is software. Your repair shop is the business.</strong> When you
            submit a repair through a shop page on this platform:
          </p>
          <ul>
            <li>The repair shop diagnoses and fixes your device.</li>
            <li>The repair shop sets the price, the warranty, and the refund policy.</li>
            <li>The repair shop ships your device back to you (or returns it in-store).</li>
            <li>The repair shop is the seller and the merchant of record for the repair payment.</li>
            <li>RepairCenter provides the tools that make all of that easier — but the repair work itself is the shop&apos;s responsibility.</li>
          </ul>

          <h3>What this means for you</h3>
          <h4>Pricing, warranty, and refunds</h4>
          <p>
            Each shop sets its own pricing, warranty length, refund policy, and return shipping
            cost. These can vary from shop to shop. Confirm them with the shop before mailing or
            dropping off your device. If a shop&apos;s estimate, intake report, or shop page does
            not list the terms you need, ask the shop directly through the message thread on your
            tracking page.
          </p>
          <p>
            RepairCenter does not provide a platform-backed warranty. Warranty claims, refund
            requests, and chargeback disputes are handled by the shop, not by us.
          </p>

          <h4>Data backup is your responsibility</h4>
          <p>
            Always back up your device <em>before</em> shipping or dropping it off. Repair work can
            result in data loss even when the shop takes care, including replacement of failed
            storage, software resets, and unforeseen hardware issues during disassembly. Neither
            the shop nor RepairCenter is responsible for data loss unless the shop&apos;s own policy
            specifically says so.
          </p>

          <h4>Shipping risk</h4>
          <p>
            You are responsible for packaging your device securely and following the shop&apos;s
            mail-in instructions. Damage caused by inadequate packaging on the inbound shipment is
            not the shop&apos;s responsibility. We recommend buying shipping insurance.
          </p>
          <p>
            On the return shipment, the shop chooses the carrier and the service level. If your
            device arrives damaged, contact the shop right away — the shop will work with the
            carrier on a claim.
          </p>

          <h4>Abandoned devices</h4>
          <p>
            Each shop sets its own policy for devices that are never picked up, never paid for, or
            where the customer stops responding. Confirm this with the shop. RepairCenter does not
            take possession of any physical device.
          </p>

          <h4>Locked devices</h4>
          <p>
            Disable Find My Device / Activation Lock and remove screen passcodes unless the
            shop&apos;s instructions tell you to leave them on. A locked device may be returned
            unrepaired, and any deposit may be forfeited per the shop&apos;s policy.
          </p>

          <h4>Repair outcomes</h4>
          <p>
            Not every device can be repaired economically. If a shop determines the cost would
            exceed the device&apos;s value, parts are unavailable, or the issue cannot be
            reproduced, the shop will let you know and return the device under its return policy.
            RepairCenter does not guarantee repair outcomes.
          </p>

          <h3>What RepairCenter (the platform) does and does not do</h3>
          <h4>RepairCenter does</h4>
          <ul>
            <li>Host the shop&apos;s public estimate form, tracking page, appointment booking, and customer messages.</li>
            <li>Send transactional notifications (status updates, estimate ready, payment requests, review requests, warranty reminders).</li>
            <li>Provide payment tools — Stripe checkout links and manual payment instructions — that the shop uses to collect from you.</li>
            <li>Provide the admin dashboard your shop uses to run its workflow.</li>
          </ul>

          <h4>RepairCenter does not</h4>
          <ul>
            <li>Repair your device.</li>
            <li>Set repair pricing, repair turnaround, or warranty terms.</li>
            <li>Take possession of your device.</li>
            <li>Collect or hold repair payments.</li>
            <li>Issue repair-related refunds or settle repair disputes.</li>
            <li>Speak on behalf of the shop in a dispute.</li>
          </ul>

          <h3>If the platform operator is also your repair shop</h3>
          <p>
            If the operator of RepairCenter also runs a repair business that uses this platform,
            that shop&apos;s own terms apply separately to repairs you submit to it. Look on that
            specific shop&apos;s page for its own pricing, warranty, refund, and shipping terms.
          </p>

          <h3>Questions</h3>
          <ul>
            <li><strong>About your repair:</strong> contact the shop through the message thread on your tracking page.</li>
            <li><strong>About the platform itself:</strong> see the <a href='/contact'>contact page</a>.</li>
            <li><strong>Full terms:</strong> <a href='/terms'>Terms of Service</a> · <a href='/privacy'>Privacy Policy</a></li>
          </ul>
        </div>
      </div>
    </main>
  )
}
