import './globals.css'
import { Inter, Manrope } from 'next/font/google'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
})

export const metadata = {
  title: 'Repair Center — Premium Mail-In Phone, Tablet & Laptop Repair',
  description:
    'Mail-in repair for phones, tablets, and laptops with free photo estimates, human review, tracked progress, and secure return shipping.',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} ${manrope.variable}`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}