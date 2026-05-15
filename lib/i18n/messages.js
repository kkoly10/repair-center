import en from '../../messages/en.json'
import fr from '../../messages/fr.json'
import es from '../../messages/es.json'
import pt from '../../messages/pt.json'
import { DEFAULT_LOCALE, normalizeLocale } from './config'

const BUNDLES = { en, fr, es, pt }

export function getMessages(locale) {
  const key = normalizeLocale(locale)
  return BUNDLES[key] || BUNDLES[DEFAULT_LOCALE]
}

function getNested(obj, path) {
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

function interpolate(template, vars) {
  if (typeof template !== 'string') return template
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{${name}}`
  )
}

export function createTranslator(messages, fallbackMessages) {
  return function t(key, vars) {
    let value = getNested(messages, key)
    if (value === undefined && fallbackMessages && fallbackMessages !== messages) {
      value = getNested(fallbackMessages, key)
    }
    if (value === undefined) return key
    return interpolate(value, vars)
  }
}

export function getTranslator(locale) {
  const messages = getMessages(locale)
  const fallback = BUNDLES[DEFAULT_LOCALE]
  return createTranslator(messages, fallback)
}
