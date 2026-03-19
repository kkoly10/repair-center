export default function PrivacyPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell'>
        <div className='policy-card center-card'>
          <div className='kicker'>Privacy</div>
          <h1>Privacy-first repair handling</h1>
          <p>
            This starter page establishes the tone for data-sensitive device handling. Customers should back up their data before shipping,
            remove SIM and SD cards when appropriate, and understand that only the minimum information needed for intake, quote review,
            and repair communication should be collected.
          </p>
          <ul>
            <li>Collect only the information required for quote review and repair updates.</li>
            <li>Do not access customer data beyond what is needed to test the requested function.</li>
            <li>Encourage customers to back up devices before shipping.</li>
            <li>Use secure storage and limited-access handling for intake records and device photos.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
