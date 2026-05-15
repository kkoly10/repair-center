'use client'

import Link from 'next/link'
import { useLocale } from './TranslationProvider'
import { DEFAULT_LOCALE, LOCALES } from './config'

function withLocale(href, locale) {
  if (!href) return href
  if (typeof href !== 'string') return href
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href
  }
  if (!href.startsWith('/')) return href
  if (href.startsWith('/api/') || href === '/api') return href
  if (locale === DEFAULT_LOCALE) return href
  const first = href.split('/')[1]
  if (LOCALES.includes(first)) return href
  return `/${locale}${href}`
}

export default function LocalizedLink({ href, locale: localeOverride, ...rest }) {
  const ctxLocale = useLocale()
  const locale = localeOverride || ctxLocale
  return <Link href={withLocale(href, locale)} {...rest} />
}

export function localizePath(href, locale) {
  return withLocale(href, locale)
}
