import StatusTracker from '../../components/StatusTracker'
import { REPAIR_STATUS_STEPS } from '../../lib/repairCatalog'

export default function TrackPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='lookup-card'>
          <div className='kicker'>Track your repair</div>
          <h1>Follow each step with confidence</h1>
          <p>
            This first version shows the visual workflow and layout for quote-ID-based tracking.
            The next build can connect this to a database and email magic links.
          </p>

          <div className='lookup-grid'>
            <div className='form-grid'>
              <div className='field'>
                <label>Quote ID</label>
                <input placeholder='RC-10284' />
              </div>
              <div className='field'>
                <label>Email address</label>
                <input placeholder='name@example.com' />
              </div>
            </div>
            <div className='inline-actions'>
              <button type='button' className='button button-primary'>Look up repair</button>
            </div>
          </div>
        </div>

        <div className='quote-card'>
          <div className='quote-top'>
            <div>
              <div className='quote-id'>Quote ID · RC-10284</div>
              <h2 className='quote-title'>iPhone 13 · Screen replacement</h2>
            </div>
            <span className='price-chip'>Awaiting final approval</span>
          </div>

          <div className='quote-summary'>
            <div className='quote-summary-card'>
              <strong>Preliminary estimate</strong>
              <span>$159–$189</span>
            </div>
            <div className='quote-summary-card'>
              <strong>Inspection deposit</strong>
              <span>$25 credited</span>
            </div>
            <div className='quote-summary-card'>
              <strong>Return shipping</strong>
              <span>$14.95 tracked</span>
            </div>
          </div>

          <StatusTracker steps={REPAIR_STATUS_STEPS} currentStep={4} />

          <div className='notice'>
            <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>Latest update</strong>
            Inspection has been completed and the final quote is ready for customer approval. The next stage in the real workflow
            would be approval, repair, payment confirmation, and tracked return shipment.
          </div>
        </div>
      </div>
    </main>
  )
}
