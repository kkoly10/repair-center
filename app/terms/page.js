export default function TermsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Terms of service</div>
          <h1>Repair approval, inspection, and return terms</h1>
          <p>
            These public terms explain the basic structure of the repair workflow so customers know
            how estimate approval, inspection, payment, and return shipping are handled.
          </p>

          <h3>Estimate terms</h3>
          <ul>
            <li>Photo-based estimates are preliminary unless clearly marked as final</li>
            <li>Final pricing may change after inspection if the actual condition differs from the submitted estimate request</li>
            <li>No repair work should begin without customer approval of the applicable estimate</li>
          </ul>

          <h3>Mail-in and inspection</h3>
          <ul>
            <li>Customers should follow mail-in instructions carefully and package devices securely</li>
            <li>Inspection may confirm the estimate, narrow the issue, or reveal additional damage</li>
            <li>If inspection changes the repair scope, a revised estimate may be required before continuing</li>
          </ul>

          <h3>Payments</h3>
          <ul>
            <li>Inspection deposits may be required before intake depending on the repair type</li>
            <li>Final balance must be collected before return shipping unless explicitly waived by staff</li>
            <li>Completed payments are tied to the repair order and tracked through the customer flow</li>
          </ul>

          <h3>Warranty and limitations</h3>
          <ul>
            <li>Supported repairs may include a limited repair warranty where stated</li>
            <li>Warranty scope should be limited to the work actually performed and not unrelated device failures</li>
            <li>Customers remain responsible for backing up important data before repair</li>
          </ul>

          <p>
            This page should also be reviewed and finalized with your actual business policies before
            broad public launch.
          </p>
        </div>
      </div>
    </main>
  )
}