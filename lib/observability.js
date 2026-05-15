// Thin wrapper around Sentry so calling code doesn't need to know whether
// Sentry is initialized. When NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN is unset,
// captureException is a no-op and we just log to the console. When configured,
// the error is captured AND logged so it remains visible in Vercel logs.
import * as Sentry from '@sentry/nextjs'

const ENABLED = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN)

/**
 * Report a caught error. Always logs to console; also sends to Sentry when
 * configured. `context` is added as Sentry tags/extras.
 *
 * Usage:
 *   try { ... } catch (err) {
 *     reportError(err, { area: 'notifications', eventKey: 'estimate_ready' })
 *   }
 */
export function reportError(err, context = {}) {
  // Console first — never lose visibility even if Sentry is misconfigured
  console.error(`[${context.area || 'app'}]`, context.eventKey || '', err)

  if (ENABLED) {
    try {
      Sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(context)) {
          if (v == null) continue
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            scope.setTag(k, String(v))
          } else {
            scope.setExtra(k, v)
          }
        }
        Sentry.captureException(err)
      })
    } catch {
      // Never let observability instrumentation break the calling code
    }
  }
}
