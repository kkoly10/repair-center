// Per-request Content-Security-Policy builder.
//
// Pattern: nonce + 'strict-dynamic' (with backward-compat fallbacks).
// - Modern browsers honor the nonce + 'strict-dynamic' and ignore the
//   'unsafe-inline' + host fallbacks below
// - Older browsers (no strict-dynamic support) fall back to the host
//   allowlist, which is still safer than today's blanket 'unsafe-inline'
//
// DEBT: style-src still has 'unsafe-inline' because hundreds of inline
// style={{...}} attributes across the codebase render as actual
// `style="..."` attributes that can't carry nonces. Tightening style-src
// is tracked as a separate refactor (convert to CSS Modules or
// 'unsafe-hashes' with per-style hashes).
//
// Returns { headerName, value } so callers can choose enforce vs report-only
// from a single source of truth.

const STRIPE_HOSTS = 'https://js.stripe.com https://*.stripe.com https://api.stripe.com'
const SUPABASE_HOSTS = 'https://*.supabase.co wss://*.supabase.co'
const RESEND_HOSTS = 'https://api.resend.com'
const SENTRY_HOSTS = 'https://*.ingest.sentry.io https://*.sentry.io'

export function buildCsp(nonce, { reportOnly = false, reportEndpoint = '/api/csp-report' } = {}) {
  const directives = [
    `default-src 'self'`,
    // Modern browsers: nonce + strict-dynamic supersedes everything that follows.
    // Old browsers: fall back to host allowlist + unsafe-inline (still tighter
    // than no CSP at all). 'unsafe-eval' kept because Next.js dev tooling and
    // some Stripe.js code paths need it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' https: ${STRIPE_HOSTS}`,
    // See DEBT note above re: style-src 'unsafe-inline'.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' ${SUPABASE_HOSTS} ${STRIPE_HOSTS} ${RESEND_HOSTS} ${SENTRY_HOSTS}`,
    `frame-src 'self' ${STRIPE_HOSTS} https://hooks.stripe.com https://connect.stripe.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' ${STRIPE_HOSTS} https://connect.stripe.com`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
    `report-uri ${reportEndpoint}`,
  ]

  return {
    headerName: reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    value: directives.join('; '),
  }
}

// Web-safe base64 nonce. 16 bytes → 22 chars after stripping padding.
export function generateNonce() {
  const arr = new Uint8Array(16)
  // crypto is global in both Node 20+ and the Edge runtime
  crypto.getRandomValues(arr)
  // btoa works in Edge; in Node 20+ it's also global
  return btoa(String.fromCharCode(...arr)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
