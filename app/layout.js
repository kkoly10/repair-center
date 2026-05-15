import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { TranslationProvider } from '../lib/i18n/TranslationProvider'
import { getServerMessages } from '../lib/i18n/server'
import { getTranslator } from '../lib/i18n/messages'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
})

export async function generateMetadata() {
  const { locale } = await getServerMessages()
  const t = getTranslator(locale)
  return {
    title: t('home.metaTitle'),
    description: t('home.metaDescription'),
  }
}

export default async function RootLayout({ children }) {
  const { locale, messages } = await getServerMessages()
  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${plusJakartaSans.variable}`}>
        <TranslationProvider locale={locale} messages={messages}>
          <SiteHeader />
          {children}
          <SiteFooter />
        </TranslationProvider>
      </body>
    </html>
  )
}
