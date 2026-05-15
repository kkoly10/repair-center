import * as Sentry from '@sentry/nextjs'
import { isAnalyticsConsented } from './lib/sentryBrowser'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

// GDPR gate: only initialize the browser Sentry SDK when the visitor has
// opted in to "analytics" cookies. See `lib/sentryBrowser.js` for the
// reasoning — we deliberately don't try to init mid-session; the cookie
// banner reloads the page after consent so this module runs again with
// the new cookie state.
if (dsn && isAnalyticsConsented()) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || 'development',
    // Lower trace rate in production to keep within free tier
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 0.0,
    replaysSessionSampleRate: 0.0,
    // Ignore non-actionable noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  })
}
