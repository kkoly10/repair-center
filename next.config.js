/** @type {import('next').NextConfig} */

// Security headers applied to every response. CSP intentionally permissive
// for Stripe + Supabase + Resend integrations; tighten as the third-party
// surface stabilizes.
const STRIPE_HOSTS = "https://js.stripe.com https://*.stripe.com https://api.stripe.com"
const SUPABASE_HOSTS = "https://*.supabase.co wss://*.supabase.co"
const RESEND_HOSTS = "https://api.resend.com"

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${STRIPE_HOSTS}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `connect-src 'self' ${SUPABASE_HOSTS} ${STRIPE_HOSTS} ${RESEND_HOSTS}`,
  `frame-src 'self' ${STRIPE_HOSTS}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self' ${STRIPE_HOSTS}`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")' },
]

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

// Wrap with Sentry only when configured. In dev / when SENTRY_DSN is unset,
// the wrapper is skipped so contributors can run `next build` without Sentry
// credentials. Sourcemap upload is disabled unless an auth token is also set.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { withSentryConfig } = require('@sentry/nextjs')
  module.exports = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    hideSourceMaps: true,
    disableLogger: true,
  })
} else {
  module.exports = nextConfig
}
