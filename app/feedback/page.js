import Link from 'next/link'
import PublicFeedbackForm from '../../components/PublicFeedbackForm'
import SiteFooter from '../../components/SiteFooter'

export const metadata = {
  title: 'Send Feedback',
  description: 'Share your thoughts, report a bug, or suggest a new feature.',
}

export default function FeedbackPage() {
  return (
    <>
      <header style={{ borderBottom: '1px solid var(--line)', padding: '0 24px', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
          <Link href='/' style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            ← Back
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 540, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, margin: '0 0 10px' }}>Send us feedback</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
            We read every submission. Found a bug? Have an idea? Just want to say hi?
          </p>
        </div>
        <PublicFeedbackForm />
      </main>

      <SiteFooter />
    </>
  )
}
