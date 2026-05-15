'use client'

import { createContext, useContext, useMemo } from 'react'
import { createTranslator, getMessages } from './messages'
import { DEFAULT_LOCALE } from './config'

const TranslationContext = createContext({
  locale: DEFAULT_LOCALE,
  messages: null,
  t: (key) => key,
})

export function TranslationProvider({ locale, messages, children }) {
  const value = useMemo(() => {
    const fallback = getMessages(DEFAULT_LOCALE)
    return {
      locale: locale || DEFAULT_LOCALE,
      messages: messages || fallback,
      t: createTranslator(messages || fallback, fallback),
    }
  }, [locale, messages])

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  return useContext(TranslationContext)
}

export function useT() {
  return useContext(TranslationContext).t
}

export function useLocale() {
  return useContext(TranslationContext).locale
}
