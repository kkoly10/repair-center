import Link from 'next/link'
import SiteFooter from '../../components/SiteFooter'

export const metadata = {
  title: { default: 'Help Center', template: '%s — Help Center' },
  description: 'Find answers to common questions about repair tracking, appointments, payments, and shop management.',
}

export default function HelpLayout({ children }) {
  return (
    <>
      <header style={{
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, height: 56 }}>
          <Link href='/help' style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            Help Center
          </Link>
          <span style={{ color: 'var(--line)', fontSize: 18 }}>|</span>
          <Link href='/' style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>← Back to site</Link>
        </div>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}
