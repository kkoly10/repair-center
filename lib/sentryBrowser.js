/**
 * Browser-side Sentry consent gate.
 *
 * Why this exists:
 *   `sentry.client.config.js` runs at app bootstrap. We don't want to load &
 *   init Sentry until the visitor has opted in to analytics-class cookies
 *   (per GDPR / ePrivacy). We can't dynamically tear down a Sentry SDK that's
 *   already initialized, so we keep things simple:
 *
 *   1. At module load, `sentry.client.config.js` calls `isAnalyticsConsented()`.
 *      If true, it initializes Sentry. If false, it no-ops.
 *   2. When the user grants analytics consent via the cookie banner, the
 *      banner reloads the page (full nav, not router.refresh). On the new
 *      page load, the cookie reads true and Sentry initializes normally.
 *
 *   The reload trades a single page transition for code simplicity — no
 *   mid-session SDK boot, no double-init risk, no orphaned scope state. This
 *   is a well-accepted pattern for consent-gated analytics.
 */
import { readConsent } from './consent'

export function isAnalyticsConsented() {
  // Server-side: never init Sentry browser SDK from the server config — that's
  // what sentry.server.config.js is for. Return false defensively.
  if (typeof document === 'undefined') return false
  const consent = readConsent()
  return consent !== null && consent.analytics === true
}
