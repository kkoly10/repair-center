/**
 * Unit tests for the cookie consent helpers in `lib/consent.js`.
 *
 * Jest runs in `testEnvironment: 'node'` (see jest.config.js) — there is no
 * real `document` object. We install a minimal stub on `global.document.cookie`
 * with a getter/setter that mimics the browser's behavior of appending to a
 * single cookie string. That's enough to exercise readConsent / writeConsent /
 * hasMadeChoice / clearConsent end-to-end without spinning up jsdom.
 */

const {
  readConsent,
  writeConsent,
  clearConsent,
  hasMadeChoice,
  CONSENT_COOKIE_NAME,
} = require('../../lib/consent')

function installDocumentStub() {
  // Backing store: map of cookie name -> raw value (encoded form). The browser
  // serializes all cookies into a single semicolon-delimited string when read.
  const jar = new Map()

  Object.defineProperty(global, 'document', {
    configurable: true,
    value: {
      get cookie() {
        return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
      },
      set cookie(str) {
        // Parse a Set-Cookie-style assignment. We only need name=value plus
        // an optional `max-age=0` to clear.
        const semi = String(str).split(';')
        const [head, ...attrs] = semi
        const eq = head.indexOf('=')
        if (eq === -1) return
        const name = head.slice(0, eq).trim()
        const value = head.slice(eq + 1).trim()
        const lower = attrs.map((a) => a.trim().toLowerCase())
        const isDeletion = lower.some((a) => a === 'max-age=0')
        if (isDeletion) jar.delete(name)
        else jar.set(name, value)
      },
    },
  })

  return jar
}

function uninstallDocumentStub() {
  delete global.document
}

describe('lib/consent', () => {
  beforeEach(() => {
    installDocumentStub()
  })

  afterEach(() => {
    uninstallDocumentStub()
  })

  it('readConsent() returns null when no cookie is set', () => {
    expect(readConsent()).toBeNull()
  })

  it('readConsent() returns the parsed object when the cookie is present and valid', () => {
    writeConsent({ functional: true, analytics: false })
    const parsed = readConsent()
    expect(parsed).not.toBeNull()
    expect(parsed.essential).toBe(true)
    expect(parsed.functional).toBe(true)
    expect(parsed.analytics).toBe(false)
    expect(typeof parsed.ts).toBe('string')
    // ISO timestamp shape check (YYYY-MM-DDTHH:mm:ss.sssZ)
    expect(parsed.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('readConsent() returns null on malformed cookie content (defensive)', () => {
    // Bypass writeConsent to plant a garbage cookie value
    document.cookie = `${CONSENT_COOKIE_NAME}=not-valid-json-here`
    expect(readConsent()).toBeNull()

    // Valid JSON but wrong shape — missing boolean fields
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent('{"foo":"bar"}')}`
    expect(readConsent()).toBeNull()

    // Valid JSON, primitive (not an object)
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent('"hello"')}`
    expect(readConsent()).toBeNull()
  })

  it('writeConsent({analytics: true}) sets the right cookie shape', () => {
    const written = writeConsent({ functional: false, analytics: true })
    // The function returns the value it wrote
    expect(written).toEqual({
      essential: true,
      functional: false,
      analytics: true,
      ts: expect.any(String),
    })
    // The serialized cookie can be re-read end-to-end
    const reread = readConsent()
    expect(reread.essential).toBe(true)
    expect(reread.functional).toBe(false)
    expect(reread.analytics).toBe(true)
  })

  it('hasMadeChoice() returns false initially and true after writeConsent', () => {
    expect(hasMadeChoice()).toBe(false)
    writeConsent({ functional: false, analytics: false })
    expect(hasMadeChoice()).toBe(true)
    clearConsent()
    expect(hasMadeChoice()).toBe(false)
  })

  it('writeConsent always coerces essential to true, even if caller passes false', () => {
    const written = writeConsent({ essential: false, functional: false, analytics: false })
    expect(written.essential).toBe(true)
    const reread = readConsent()
    expect(reread.essential).toBe(true)
  })
})
