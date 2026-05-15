import Link from 'next/link'

export const metadata = { title: 'Onboarding Link Expired' }

export default function ConnectRefreshPage() {
  return (
    <div className='site-shell' style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 640, margin: '0 auto' }}>
      <div className='policy-card'>
        <h1 style={{ marginBottom: 12 }}>Onboarding Link Expired</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Your Stripe onboarding link has expired. Return to Billing to restart the setup process.
        </p>
        <Link href='/admin/billing' className='button button-secondary'>
          Back to Billing
        </Link>
      </div>
    </div>
  )
}
