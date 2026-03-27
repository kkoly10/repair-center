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
              <small>Mail-In Device Repair</small>
            </span>
          </div>
          <p className='footer-copy'>
            Mail-in repair for phones, tablets, and laptops with free estimates, human-reviewed
            quotes, tracked repair progress, and secure return shipping.
          </p>
        </div>

        <div>
          <h4>Start Here</h4>
          <div className='footer-links'>
            <Link href='/estimate'>Free Estimate</Link>
            <Link href='/how-it-works'>How It Works</Link>
            <Link href='/track'>Track Repair</Link>
            <Link href='/faq'>FAQ</Link>
          </div>
        </div>

        <div>
          <h4>Services</h4>
          <div className='footer-links'>
            <Link href='/repairs'>Repair Services</Link>
            <Link href='/devices'>Supported Devices</Link>
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