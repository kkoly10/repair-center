import Link from 'next/link'

export default function SuspendedPage() {
  return (
    <main className='page-hero'>
      <div className='site-shell'>
        <div className='policy-card center-card' style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div className='kicker'>Account suspended</div>
          <h1>Access restricted</h1>
          <p style={{ marginTop: 12 }}>
            Your organization&apos;s account is not active. This may be due to a billing issue,
            a plan expiry, or a suspension by our team.
          </p>
          <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.9rem' }}>
            Contact support to restore access, or sign in with a different account.
          </p>
          <div className='inline-actions' style={{ marginTop: 24, justifyContent: 'center' }}>
            <Link href='/admin/billing' className='button button-primary'>
              View billing &amp; subscription
            </Link>
            <Link href='/admin/login' className='button button-secondary'>
              Sign in with different account
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
