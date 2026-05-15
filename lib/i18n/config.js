export const LOCALES = ['en', 'fr', 'es', 'pt']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const LOCALE_LABELS = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
}

export function isLocale(value) {
  return LOCALES.includes(value)
}

export function normalizeLocale(value) {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function detectLocaleFromAcceptLanguage(header) {
  if (!header) return DEFAULT_LOCALE
  const entries = header
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';q=')
      const q = qPart ? parseFloat(qPart) : 1
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0 }
    })
    .sort((a, b) => b.q - a.q)
  for (const { tag } of entries) {
    const short = tag.split('-')[0]
    if (isLocale(short)) return short
  }
  return DEFAULT_LOCALE
}
