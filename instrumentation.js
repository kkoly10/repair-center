// Next.js instrumentation hook — runs once per server runtime.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export async function onRequestError(err, request, context) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureRequestError(err, request, context)
  }
}
