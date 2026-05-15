/** @type {import('next').NextConfig} */

// Static security headers. CSP itself is built per-request in proxy.js so it
// can carry a fresh nonce — see lib/csp.js. These remaining headers don't
// need per-request data, so keeping them here lets Next.js attach them at
// the framework level (cheaper than middleware).
const securityHeaders = [
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
