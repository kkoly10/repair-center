import './globals.css'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export const metadata = {
  title: 'Repair Center — Mail-In Tech Repair',
  description:
    'Premium mail-in repair for phones, tablets, and laptops. Upload photos, get a free estimate, approve the repair, and track every step.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
