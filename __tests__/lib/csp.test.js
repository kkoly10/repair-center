import { buildCsp, generateNonce } from '../../lib/csp'

describe('buildCsp', () => {
  test('returns enforce header by default', () => {
    const { headerName } = buildCsp('abc123')
    expect(headerName).toBe('Content-Security-Policy')
  })

  test('returns report-only header when requested', () => {
    const { headerName } = buildCsp('abc123', { reportOnly: true })
    expect(headerName).toBe('Content-Security-Policy-Report-Only')
  })

  test('embeds the nonce in script-src', () => {
    const { value } = buildCsp('abc123')
    expect(value).toContain(`'nonce-abc123'`)
    expect(value).toContain(`script-src 'self' 'nonce-abc123' 'strict-dynamic'`)
  })

  test('keeps unsafe-inline + https fallback for old browsers (ignored when strict-dynamic is supported)', () => {
    const { value } = buildCsp('x')
    // The fallback is intentional — see comment in lib/csp.js
    expect(value).toContain(`'unsafe-inline'`)
  })

  test('whitelists Stripe, Supabase, Resend, Sentry hosts in connect-src', () => {
    const { value } = buildCsp('x')
    expect(value).toContain('https://*.supabase.co')
    expect(value).toContain('https://js.stripe.com')
    expect(value).toContain('https://api.resend.com')
    expect(value).toContain('https://*.ingest.sentry.io')
  })

  test('forbids object embeds and frame ancestors', () => {
    const { value } = buildCsp('x')
    expect(value).toContain(`object-src 'none'`)
    expect(value).toContain(`frame-ancestors 'none'`)
  })

  test('includes report-uri directive', () => {
    const { value } = buildCsp('x')
    expect(value).toContain('report-uri /api/csp-report')
  })

  test('reportEndpoint override is honored', () => {
    const { value } = buildCsp('x', { reportEndpoint: '/sec/report' })
    expect(value).toContain('report-uri /sec/report')
  })
})

describe('generateNonce', () => {
  test('returns a URL-safe non-empty string', () => {
    const n = generateNonce()
    expect(typeof n).toBe('string')
    expect(n.length).toBeGreaterThan(10)
    // No +, /, or = in URL-safe base64
    expect(n).not.toMatch(/[+/=]/)
  })

  test('returns different values across calls', () => {
    const a = generateNonce()
    const b = generateNonce()
    expect(a).not.toBe(b)
  })
})
