export const metadata = {
  title: 'Platform Terms — RepairCenter',
  description:
    'Platform terms of service for repair shops that use RepairCenter as their SaaS software.',
}

export default function PlatformTermsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Platform terms</div>
          <h1>Platform Terms of Service</h1>
          <p>
            <strong>Effective date:</strong> May 14, 2026 <br />
            <strong>For:</strong> repair shops (&ldquo;Shop&rdquo;, &ldquo;you&rdquo;) that use the
            RepairCenter platform.
          </p>

          <div className='notice notice-warn' style={{ marginTop: 12 }}>
            <strong>Draft notice.</strong> These template terms are provided for operational
            readiness and should be reviewed by a qualified attorney before public launch.
            They are not legal advice.
          </div>

          <h3>1. The service we provide</h3>
          <p>
            RepairCenter (&ldquo;RepairCenter&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a
            software-as-a-service platform for independent repair shops. The platform includes
            features such as a public estimate form, customer tracking, repair workflow, parts
            inventory, appointment booking, review collection, customer notifications, and
            subscription billing.
          </p>
          <p>
            The service is the software only. Repairs are performed by your Shop, by people you
            employ, using your own tools, supplies, and processes. RepairCenter is not a party to
            the repair contract between you and your customer.
          </p>

          <h3>2. Account registration</h3>
          <ul>
            <li>
              You must register an account with accurate information about your shop, including a
              valid business email, shop name, and billing contact.
            </li>
            <li>
              Each account corresponds to one Organization (one shop). The features and limits of
              your account are governed by the plan you are on.
            </li>
            <li>
              You are responsible for keeping your login credentials secure and for all activity
              that occurs under your Organization.
            </li>
          </ul>

          <h3>3. Your responsibilities as a Shop</h3>
          <p>You are solely responsible for:</p>
          <ul>
            <li>The actual repair services you offer, including diagnosis, parts, labor, and quality of workmanship.</li>
            <li>Your pricing, your repair menu, your estimates, and your shipping instructions.</li>
            <li>Your warranty terms and your refund / return policy.</li>
            <li>Your policy for abandoned devices, data backup, data loss, locked devices, and devices that cannot be repaired.</li>
            <li>Collecting and remitting any sales tax, excise tax, or other tax owed on the repair transaction.</li>
            <li>Any chargeback, dispute, or refund arising from a repair payment you collect from a customer.</li>
            <li>Your communications with customers, including emails, SMS, and messages sent through the platform.</li>
            <li>Compliance with all federal, state, and local laws that apply to your repair business and your customer relationships, including consumer protection, data privacy, advertising, warranty, and licensing laws.</li>
            <li>Posting your own privacy notice if your jurisdiction or transaction volume requires one.</li>
          </ul>

          <h3>4. Staff and user roles</h3>
          <ul>
            <li>You may invite staff users to your Organization. Each staff user must agree to these terms.</li>
            <li>Owner-role users may invite, remove, or change the role of other staff users.</li>
            <li>You are responsible for revoking access promptly when a staff member leaves your shop.</li>
            <li>RepairCenter is not responsible for actions taken by your staff inside your Organization.</li>
          </ul>

          <h3>5. Customer data ownership</h3>
          <p>
            Customer information collected through your Shop&rsquo;s public pages (name, email,
            phone, device, photos, messages, repair history) is data you control. RepairCenter
            processes this data on your behalf as a service provider / processor. We do not sell
            customer information and we do not use it for our own marketing.
          </p>
          <p>
            You remain responsible for honoring customer privacy requests (access, deletion,
            correction) where applicable law requires you to. We will reasonably cooperate.
          </p>

          <h3>6. Acceptable use</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Use the platform to engage in unlawful, deceptive, or fraudulent activity.</li>
            <li>Misrepresent your shop, your services, or your pricing to customers.</li>
            <li>Use the platform to send spam, harass customers, or violate anti-spam laws (CAN-SPAM, TCPA, etc.).</li>
            <li>Scrape, reverse-engineer, or attempt to circumvent the security of the platform.</li>
            <li>Resell or sublicense the platform without our written permission.</li>
            <li>Upload malicious content, illegal content, or content you do not have rights to.</li>
            <li>Solicit, write, or post fake reviews, paid sentiment-conditioned reviews, or insider reviews on behalf of your shop. See the FTC Consumer Reviews and Testimonials Rule.</li>
          </ul>

          <h3>7. Repair services are not provided by RepairCenter</h3>
          <p>
            RepairCenter is not a repair shop. RepairCenter does not diagnose devices, does not
            perform repairs, does not source parts, does not ship devices, and does not provide
            a warranty for repair work. All repair-related obligations to your customers are yours.
          </p>
          <p>
            If a customer contacts RepairCenter directly with a question about a specific repair,
            we may route the message to you. We are under no obligation to resolve repair disputes,
            issue repair-related refunds, or speak on your behalf.
          </p>

          <h3>8. Payments and merchant of record</h3>
          <ul>
            <li>
              <strong>SaaS subscription payments.</strong> Your monthly subscription to RepairCenter
              is processed through Stripe. RepairCenter is the seller and merchant of record for
              subscription payments.
            </li>
            <li>
              <strong>Repair customer payments.</strong> When your customers pay you for a repair —
              whether through a Stripe payment link, a Stripe Connect transfer in the future, or a
              manual payment mode (Cash App, Zelle, Square, cash) — your Shop is the seller and
              merchant of record for that payment. Refunds, chargebacks, and disputes for those
              payments are your responsibility.
            </li>
            <li>
              You are responsible for connecting and maintaining your own Stripe account if you use
              online card collection through the platform. We are not a party to your Stripe
              merchant agreement.
            </li>
          </ul>

          <h3>9. Subscription billing, trial, and cancellation</h3>
          <ul>
            <li>RepairCenter offers a 14-day free trial. No credit card is required to start the trial.</li>
            <li>If you do not add a payment method by the end of the trial, your account is suspended automatically. You will not be charged.</li>
            <li>If you add a payment method, your subscription begins at the published rate for the plan you select. The Founder Beta rate is $29 per month.</li>
            <li>Subscriptions are billed monthly in advance. You can cancel at any time from the Stripe Customer Portal linked on the <a href='/admin/billing'>billing page</a>.</li>
            <li>Cancellation takes effect at the end of the current billing period. We do not pro-rate refunds for partial months unless required by law.</li>
            <li>If a payment fails, your account moves to a past-due state and may be suspended after a reasonable grace period.</li>
            <li>We may change pricing for future plans on reasonable advance notice. Founder Beta accounts may be eligible for grandfathered pricing or terms at our discretion when public tiers launch.</li>
          </ul>

          <h3>10. Platform availability</h3>
          <ul>
            <li>We aim for high availability but do not guarantee uninterrupted service.</li>
            <li>We may perform scheduled maintenance and emergency maintenance from time to time.</li>
            <li>We are not liable for downtime caused by our hosting, database, payment, or email providers.</li>
          </ul>

          <h3>11. Beta features</h3>
          <p>
            Features marked as &ldquo;Founder Beta&rdquo;, &ldquo;beta&rdquo;, or &ldquo;preview&rdquo;
            are provided as-is and may change, regress, or be removed without notice. We provide
            them so you can test the product and give us feedback. Beta features are not covered by
            any service-level commitment.
          </p>

          <h3>12. Limitation of liability</h3>
          <ul>
            <li>
              To the maximum extent permitted by law, RepairCenter&rsquo;s total liability to you
              for any claim related to the platform is limited to the amount you paid for the
              platform in the twelve months immediately before the claim arose.
            </li>
            <li>
              RepairCenter is not liable for indirect, incidental, special, consequential, or
              punitive damages, including lost profits, lost revenue, lost data, lost goodwill, or
              business interruption.
            </li>
            <li>
              RepairCenter is not liable for repair outcomes, parts costs, shipping damage, device
              data loss, or customer disputes related to repairs you perform.
            </li>
          </ul>

          <h3>13. Indemnification</h3>
          <p>
            You agree to defend, indemnify, and hold harmless RepairCenter and its officers,
            employees, and agents from any claim, loss, damage, or expense (including reasonable
            attorney&apos;s fees) arising from:
          </p>
          <ul>
            <li>Repair services you perform.</li>
            <li>Your communications with customers.</li>
            <li>Your collection or refund of repair payments.</li>
            <li>Your handling of customer data.</li>
            <li>Your violation of these terms or any applicable law.</li>
          </ul>

          <h3>14. Termination and suspension</h3>
          <ul>
            <li>You may terminate your account at any time by cancelling your subscription and discontinuing use of the platform.</li>
            <li>We may suspend or terminate your account at any time for material breach of these terms, failure to pay, abusive behavior, or to comply with law.</li>
            <li>On termination, you may export your data via the CSV export feature in the admin dashboard. We may delete suspended account data after a reasonable retention period.</li>
          </ul>

          <h3>15. Governing law and venue</h3>
          <p>
            These terms are governed by the laws of the Commonwealth of Virginia, without regard
            to its conflict-of-law principles. Any dispute that cannot be resolved informally shall
            be brought in the state or federal courts located in Virginia, and each party consents
            to the exclusive jurisdiction of those courts. <em>Note: the choice of governing law
            and venue is a placeholder pending attorney review.</em>
          </p>

          <h3>16. Changes to these terms</h3>
          <p>
            We may update these terms from time to time. Material changes will be communicated by
            email to your billing contact at least 30 days before they take effect. Continued use
            of the platform after the effective date constitutes acceptance.
          </p>

          <h3>17. Contact</h3>
          <p>
            Email: <strong>[support email — set before launch]</strong> <br />
            Mailing address: <strong>[platform mailing address — set before launch]</strong> <br />
            Legal entity: <strong>[business entity name — set before launch]</strong>
          </p>
          <p>
            For privacy questions, see the <a href='/privacy'>Privacy Policy</a>. Customer-facing
            repair terms are in the <a href='/terms'>Terms of Service</a> and the{' '}
            <a href='/shop-responsibility'>Shop Responsibility</a> page.
          </p>
        </div>
      </div>
    </main>
  )
}
