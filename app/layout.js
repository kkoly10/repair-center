import './globals.css'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export const metadata = {
  title: 'Repair Center — Premium Mail-In Phone, Tablet & Laptop Repair',
  description:
    'Mail-in repair for phones, tablets, and laptops with free photo estimates, human review, tracked progress, and secure return shipping.',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}