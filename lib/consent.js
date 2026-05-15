/**
 * GDPR cookie-consent helpers.
 *
 * Stores user consent in a first-party cookie `cc_consent` with shape:
 *   { essential: true, functional: bool, analytics: bool, ts: <iso> }
 *
 * `essential` is always coerced to `true` (essential cookies cannot be disabled
 * — see the Stripe Checkout / Supabase auth note in `components/CookieBanner.js`).
 *
 * These helpers are designed to be import-safe in any environment (node/edge/SSR)
 * — they check for `document` before touching cookies.
 */

const COOKIE_NAME = 'cc_consent'
// One year in seconds. Long-lived so we don't re-prompt users on every visit.
const MAX_AGE = 60 * 60 * 24 * 365

function getCookieString() {
  if (typeof document === 'undefined') return ''
  return document.cookie || ''
}

function findCookieValue(name, cookieString = getCookieString()) {
  if (!cookieString) return null
  const parts = cookieString.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    const key = eq === -1 ? trimmed : trimmed.slice(0, eq)
    if (key === name) {
      return eq === -1 ? '' : decodeURIComponent(trimmed.slice(eq + 1))
    }
  }
  return null
}

/**
 * Returns the parsed consent object, or `null` if no choice has been made
 * (or the cookie is malformed / corrupt).
 *
 * Optional `cookieString` argument exists for testability — pass a raw
 * `document.cookie`-style string. Defaults to reading from `document.cookie`.
 */
export function readConsent(cookieString) {
  const raw = findCookieValue(COOKIE_NAME, cookieString)
  if (raw === null || raw === '') return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    // Defensive shape check: a valid consent object always has booleans for the
    // three categories. If anything is missing, treat as "no choice made" so we
    // re-prompt and don't accidentally treat undefined as a "no" for analytics.
    if (
      typeof parsed.essential !== 'boolean' ||
      typeof parsed.functional !== 'boolean' ||
      typeof parsed.analytics !== 'boolean'
    ) {
      return null
    }
    return {
      essential: true, // always coerce in case stored value is somehow false
      functional: parsed.functional === true,
      analytics: parsed.analytics === true,
      ts: typeof parsed.ts === 'string' ? parsed.ts : null,
    }
  } catch {
    return null
  }
}

/**
 * Writes consent to the cookie. `essential` is always forced to `true`.
 * No-op when `document` is unavailable (SSR safety).
 *
 * Returns the object that was written, useful for tests and for immediately
 * updating local state without re-reading the cookie.
 */
export function writeConsent(prefs) {
  const value = {
    essential: true,
    functional: prefs && prefs.functional === true,
    analytics: prefs && prefs.analytics === true,
    ts: new Date().toISOString(),
  }
  if (typeof document !== 'undefined') {
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
  }
  return value
}

/**
 * Clears the consent cookie. The next page load will re-show the banner.
 * No-op on the server.
 */
export function clearConsent() {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

/**
 * `true` once the user has made any choice (accept-all, essential-only, or
 * customize+save). Used to suppress the banner on subsequent page loads.
 */
export function hasMadeChoice(cookieString) {
  return readConsent(cookieString) !== null
}

export const CONSENT_COOKIE_NAME = COOKIE_NAME
