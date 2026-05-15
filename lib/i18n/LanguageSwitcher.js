'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE, DEFAULT_LOCALE } from './config'
import { useLocale } from './TranslationProvider'

export default function LanguageSwitcher({ className }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentLocale = useLocale()
  const [isPending, startTransition] = useTransition()

  function stripLocaleFromPath(path) {
    if (!path) return '/'
    const segments = path.split('/').filter(Boolean)
    if (segments.length > 0 && LOCALES.includes(segments[0])) {
      return '/' + segments.slice(1).join('/')
    }
    return path
  }

  function handleChange(e) {
    const next = e.target.value
    const cleanPath = stripLocaleFromPath(pathname || '/')
    const basePath = next === DEFAULT_LOCALE ? cleanPath : `/${next}${cleanPath === '/' ? '' : cleanPath}`
    const queryString = searchParams?.toString() || ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const targetPath = `${basePath || '/'}${queryString ? `?${queryString}` : ''}${hash}`
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
    startTransition(() => {
      router.push(targetPath)
      router.refresh()
    })
  }

  return (
    <select
      className={className || 'language-switcher'}
      value={currentLocale}
      onChange={handleChange}
      disabled={isPending}
      aria-label='Language'
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale]}
        </option>
      ))}
    </select>
  )
}
