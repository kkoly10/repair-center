import Link from 'next/link'

export const metadata = {
  title: 'Page Not Found — RepairCenter',
}

export default function NotFound() {
  return (
    <main className='page-hero'>
      <div className='site-shell page-stack' style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className='kicker'>404</div>
        <h1>Page not found</h1>
        <p style={{ color: 'var(--text-muted, #666)', maxWidth: 480, margin: '0 auto 2rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className='inline-actions' style={{ justifyContent: 'center' }}>
          <Link href='/' className='button button-primary'>
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
