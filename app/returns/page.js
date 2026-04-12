import { PUBLIC_BUSINESS_INFO } from '../../lib/publicBusinessInfo'

export default function ReturnsPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>Returns & refund policy</div>
          <h1>Returns and refund policy</h1>
          <p>
            <strong>Effective date:</strong> March 31, 2026
          </p>

          <p>
            Refund and return decisions depend on the stage of the repair, the condition of the device,
            shipping status, parts usage, and payment status.
          </p>

          <h3>General rules</h3>
          <ul>
            <li>You may cancel before shipping your device.</li>
            <li>If work has not started, any refundable amount is returned to the original payment method.</li>
            <li>If the device cannot be repaired, we may return it and refund eligible charges based on the work already performed.</li>
            <li>Return shipping charges, completed add-on work, and non-recoverable costs may be excluded from refunds.</li>
          </ul>

          <h3>How to ask for help</h3>
          <ul>
            <li>Use the message thread on your tracking page whenever possible.</li>
            <li>Email <strong>{PUBLIC_BUSINESS_INFO.supportEmail}</strong> and include your Quote ID or Order Number.</li>
            <li>Urgent issues may also be directed to <strong>{PUBLIC_BUSINESS_INFO.supportPhone}</strong>.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
