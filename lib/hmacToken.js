import { createHmac } from 'crypto'

const SECRET = process.env.EMAIL_LINK_SECRET

export function generateToken(quoteId) {
  if (!SECRET) return null
  return createHmac('sha256', SECRET).update(quoteId).digest('hex')
}

/**
 * Returns true if the token is valid, not provided, or secret is not configured.
 * Only returns false when a secret is set and the provided token is wrong.
 */
export function verifyToken(quoteId, token) {
  if (!SECRET) return true
  if (!token) return true
  const expected = createHmac('sha256', SECRET).update(quoteId).digest('hex')
  return token === expected
}
