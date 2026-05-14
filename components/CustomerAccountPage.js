import Link from 'next/link'
import CustomerSignOutButton from './CustomerSignOutButton'

const STATUS_LABELS = {
  awaiting_mail_in: 'Awaiting Mail-In',
  in_transit_to_shop: 'In Transit',
  received: 'Received',
  inspection: 'Inspection',
  awaiting_final_approval: 'Awaiting Approval',
  approved: 'Approved',
  waiting_parts: 'Waiting for Parts',
  repairing: 'Repairing',
  testing: 'Testing',
  awaiting_balance_payment: 'Awaiting Payment',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  declined: 'Declined',
  returned_unrepaired: 'Returned Unrepaired',
}

export default function CustomerAccountPage({ customer, quotes, orgSlug }) {
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        <div className='info-card'>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className='kicker'>My Account</div>
              <h1>{name}</h1>
              {customer.email ? (
                <p style={{ margin: 0, color: 'var(--muted)' }}>{customer.email}</p>
              ) : null}
            </div>
            <div style={{ alignSelf: 'flex-start', paddingTop: 4 }}>
              <CustomerSignOutButton orgSlug={orgSlug} />
            </div>
          </div>
        </div>

        <div className='policy-card'>
          <div className='kicker'>Repair history</div>
          <h3>Your repairs</h3>

          {quotes.length === 0 ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: 'var(--muted)' }}>No repairs found for this account yet.</p>
              <div className='inline-actions' style={{ marginTop: 16 }}>
                <Link href={`/shop/${orgSlug}/estimate`} className='button button-primary'>
                  Start Free Estimate
                </Link>
              </div>
            </div>
          ) : (
            <div className='preview-meta' style={{ marginTop: 18 }}>
              {quotes.map((q) => {
                const device = [q.brand_name, q.model_name].filter(Boolean).join(' ') || 'Device'
                const statusLabel = q.order_status
                  ? (STATUS_LABELS[q.order_status] || q.order_status)
                  : q.quote_status

                return (
                  <div key={q.quote_id} className='preview-meta-row'>
                    <span>
                      <Link
                        href={`/shop/${orgSlug}/track/${q.quote_id}`}
                        style={{ fontWeight: 600 }}
                      >
                        {q.quote_id}
                      </Link>
                      {' — '}
                      {device}
                      {q.repair_type_key ? ` · ${q.repair_type_key}` : ''}
                      {' · '}
                      <span style={{ color: 'var(--muted)' }}>{statusLabel}</span>
                    </span>
                    <span style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className='policy-card'>
          <div className='kicker'>Track a specific repair</div>
          <h3>Use a Quote ID or Order Number</h3>
          <p>Have an ID handy? Look up any repair directly.</p>
          <div className='inline-actions' style={{ marginTop: 16 }}>
            <Link href={`/shop/${orgSlug}/track`} className='button button-secondary'>
              Track a Repair
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
