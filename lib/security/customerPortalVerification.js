import { readSignedCookiePayload, signCookiePayload } from './signedCookie'

export const CUSTOMER_PORTAL_CHALLENGE_COOKIE = 'rc_portal_challenge'
export const CUSTOMER_PORTAL_SESSION_COOKIE = 'rc_portal_session'

const CHALLENGE_TTL_SECONDS = 10 * 60
const SESSION_TTL_SECONDS = 30 * 60

export function normalizePortalEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function createPortalChallengeValue({ email, code, expiresAt }) {
  return signCookiePayload({
    kind: 'customer_portal_challenge',
    email: normalizePortalEmail(email),
    code: String(code),
    expiresAt,
  })
}

export function readPortalChallengeValue(value) {
  const payload = readSignedCookiePayload(value)
  if (!payload || payload.kind !== 'customer_portal_challenge') return null
  return payload
}

export function createPortalSessionValue({ email, expiresAt }) {
  return signCookiePayload({
    kind: 'customer_portal_session',
    email: normalizePortalEmail(email),
    expiresAt,
  })
}

export function readPortalSessionValue(value) {
  const payload = readSignedCookiePayload(value)
  if (!payload || payload.kind !== 'customer_portal_session') return null
  return payload
}

export function isVerificationExpired(expiresAt) {
  return !expiresAt || Number(expiresAt) <= Date.now()
}

export function getPortalChallengeCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CHALLENGE_TTL_SECONDS,
  }
}

export function getPortalSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

export function getExpiredPortalCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }
}

export function getChallengeExpiryTimestamp() {
  return Date.now() + CHALLENGE_TTL_SECONDS * 1000
}

export function getSessionExpiryTimestamp() {
  return Date.now() + SESSION_TTL_SECONDS * 1000
}
