export default function PrivacyPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Privacy policy</div>
          <h1>Privacy and device-handling principles</h1>
          <p>
            Repair Center collects only the information needed to review estimate requests,
            communicate with customers, process repairs, and return completed devices.
          </p>

          <h3>Information we collect</h3>
          <ul>
            <li>Name, email address, and phone number submitted with the repair request</li>
            <li>Device details, issue descriptions, and uploaded photos</li>
            <li>Repair status updates, payment records, shipment details, and communication history</li>
          </ul>

          <h3>How information is used</h3>
          <ul>
            <li>To review estimates and manage repair requests</li>
            <li>To communicate with customers about approval, status, payment, and shipping</li>
            <li>To document repair intake, work performed, and return shipment</li>
          </ul>

          <h3>Device data and customer content</h3>
          <ul>
            <li>Customers should back up devices before shipping them for repair</li>
            <li>Only the minimum access needed to test or complete the requested repair should be used</li>
            <li>Customers should remove SIM cards, memory cards, and other removable personal media when practical</li>
          </ul>

          <h3>Storage and access</h3>
          <ul>
            <li>Repair photos, intake notes, and related records should be kept in restricted-access systems</li>
            <li>Internal notes should remain separate from customer-visible updates</li>
          </ul>

          <p>
            This page is a public trust page and should still be reviewed and finalized with your
            business-specific legal wording before full public launch.
          </p>
        </div>
      </div>
    </main>
  )
}