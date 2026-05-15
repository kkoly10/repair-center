// Next.js instrumentation hook — runs once per server runtime.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Auto-captures uncaught route handler errors (server + edge). The captureRequestError
// helper is a no-op when Sentry.init() was not called (i.e. no DSN configured).
export const onRequestError = Sentry.captureRequestError