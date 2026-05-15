import Link from 'next/link'

export const metadata = { title: 'Stripe Account Connected' }

export default function ConnectReturnPage() {
  return (
    <div className='site-shell' style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 640, margin: '0 auto' }}>
      <div className='policy-card'>
        <h1 style={{ marginBottom: 12 }}>Stripe Account Connected</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Your Stripe account has been connected. It may take a moment for your capabilities to
          fully activate — click Refresh Status on the Billing page to check.
        </p>
        <Link href='/admin/billing' className='button button-primary'>
          Go to Billing
        </Link>
      </div>
    </div>
  )
}
