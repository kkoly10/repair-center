import crypto from 'crypto'

const DEFAULT_SIGNED_VALUE_VERSION = 'v1'

function getCookieSecret() {
  const secret = process.env.CUSTOMER_PORTAL_COOKIE_SECRET || process.env.APP_COOKIE_SECRET

  if (!secret) {
    throw new Error(
      'Missing CUSTOMER_PORTAL_COOKIE_SECRET or APP_COOKIE_SECRET environment variable.'
    )
  }

  return secret
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, 'base64').toString('utf8')
}

function createSignature(input, secret) {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url')
}

export function signCookiePayload(payload, options = {}) {
  const secret = options.secret || getCookieSecret()
  const version = options.version || DEFAULT_SIGNED_VALUE_VERSION
  const payloadText = JSON.stringify(payload)
  const encodedPayload = toBase64Url(payloadText)
  const signatureInput = `${version}.${encodedPayload}`
  const signature = createSignature(signatureInput, secret)

  return `${version}.${encodedPayload}.${signature}`
}

export function readSignedCookiePayload(value, options = {}) {
  if (!value || typeof value !== 'string') return null

  const secret = options.secret || getCookieSecret()
  const [version, encodedPayload, signature] = value.split('.')

  if (!version || !encodedPayload || !signature) return null

  const signatureInput = `${version}.${encodedPayload}`
  const expectedSignature = createSignature(signatureInput, secret)

  if (!safeCompare(signature, expectedSignature)) {
    return null
  }

  try {
    const decoded = fromBase64Url(encodedPayload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}
