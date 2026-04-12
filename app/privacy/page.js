import { PUBLIC_BUSINESS_INFO } from '../../lib/publicBusinessInfo'

export default function PrivacyPage() {
  const mailing = PUBLIC_BUSINESS_INFO.mailingAddress

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Privacy policy</div>
          <h1>Privacy and device-handling policy</h1>
          <p>
            <strong>Effective date:</strong> March 31, 2026
          </p>
          <p>
            {PUBLIC_BUSINESS_INFO.businessName} collects the information needed to review repair
            requests, communicate with customers, process payments, manage repair workflow, and
            return repaired devices.
          </p>

          <h3>What we collect</h3>
          <ul>
            <li>Contact details such as name, email address, and phone number</li>
            <li>Device information, issue descriptions, and uploaded photos</li>
            <li>Estimate, intake, status, shipment, and service-history records</li>
            <li>Payment status and transaction identifiers from payment providers</li>
            <li>Messages exchanged through repair tracking and support flows</li>
          </ul>

          <h3>How we use information</h3>
          <ul>
            <li>To review requests and send repair pricing</li>
            <li>To communicate about approval, intake, repair progress, payments, and return shipping</li>
            <li>To document device condition and support warranty or dispute handling</li>
            <li>To protect the service against fraud, abuse, and unauthorized access</li>
          </ul>

          <h3>Contact</h3>
          <ul>
            <li><strong>Privacy email:</strong> {PUBLIC_BUSINESS_INFO.privacyEmail}</li>
            <li><strong>Support email:</strong> {PUBLIC_BUSINESS_INFO.supportEmail}</li>
            <li><strong>Support phone:</strong> {PUBLIC_BUSINESS_INFO.supportPhone}</li>
            <li>
              <strong>Mailing address:</strong> {mailing.line1}
              {mailing.line2 ? `, ${mailing.line2}` : ''}, {mailing.city}, {mailing.state}{' '}
              {mailing.postalCode}
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
