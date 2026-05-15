import { headers, cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from './config'
import { getMessages, getTranslator } from './messages'

export async function getLocale() {
  try {
    const h = await headers()
    const fromHeader = h.get('x-locale')
    if (fromHeader) return normalizeLocale(fromHeader)
  } catch {}
  try {
    const c = await cookies()
    const fromCookie = c.get(LOCALE_COOKIE)?.value
    if (fromCookie) return normalizeLocale(fromCookie)
  } catch {}
  return DEFAULT_LOCALE
}

export async function getT() {
  const locale = await getLocale()
  return getTranslator(locale)
}

export async function getServerMessages() {
  const locale = await getLocale()
  return { locale, messages: getMessages(locale) }
}
