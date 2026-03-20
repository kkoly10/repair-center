import Link from 'next/link'
import StaffAuthActions from './StaffAuthActions'

export default function SiteFooter() {
  return (
    <footer className='site-footer'>
      <div className='site-shell footer-grid'>
        <div>
          <div className='brand footer-brand'>
            <span className='brand-mark'>RC</span>
            <span>
              <strong>Repair Center</strong>
              <small>Trust-first mail-in repair</small>
            </span>
          </div>
          <p className='footer-copy'>
            Premium mail-in repair for phones, tablets, and laptops with photo estimates,
            human-reviewed quotes, tracked progress, and secure return shipping.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <div className='footer-links'>
            <Link href='/estimate'>Free Estimate</Link>
            <Link href='/how-it-works'>How It Works</Link>
            <Link href='/repairs'>Repairs</Link>
            <Link href='/devices'>Devices</Link>
          </div>
        </div>

        <div>
          <h4>Support</h4>
          <div className='footer-links'>
            <Link href='/track'>Track Repair</Link>
            <Link href='/faq'>FAQ</Link>
            <Link href='/privacy'>Privacy</Link>
            <Link href='/terms'>Terms</Link>
          </div>
        </div>

        <div>
          <h4>Staff</h4>
          <div className='footer-links'>
            <StaffAuthActions />
          </div>
        </div>
      </div>
    </footer>
  )
}