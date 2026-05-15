import HelpSearch from '../../components/HelpSearch'
import HelpCategoryGrid from '../../components/HelpCategoryGrid'
import { HELP_CATEGORIES } from '../../lib/helpContent'

export const metadata = {
  title: 'Help Center',
  description: 'Find answers about repair tracking, bookings, payments, and managing your repair shop.',
}

export default function HelpHomePage() {
  const operatorCategories = HELP_CATEGORIES.filter((c) => c.audience === 'operator')
  const customerCategories = HELP_CATEGORIES.filter((c) => c.audience === 'customer')

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'var(--blue)', padding: '56px 24px 64px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '0 0 10px', fontWeight: 800 }}>
          How can we help?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.82)', margin: '0 0 28px', fontSize: '1.05rem' }}>
          Search articles or browse by category below.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HelpSearch />
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 64px' }}>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            For shop owners &amp; technicians
          </h2>
          <HelpCategoryGrid categories={operatorCategories} />
        </section>

        <section>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            For customers
          </h2>
          <HelpCategoryGrid categories={customerCategories} />
        </section>

      </div>
    </div>
  )
}
