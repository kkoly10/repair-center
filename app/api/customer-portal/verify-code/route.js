import { NextResponse } from 'next/server'
import {
  createPortalSessionValue,
  CUSTOMER_PORTAL_CHALLENGE_COOKIE,
  CUSTOMER_PORTAL_SESSION_COOKIE,
  getExpiredPortalCookieOptions,
  getPortalSessionCookieOptions,
  getSessionExpiryTimestamp,
  isVerificationExpired,
  normalizePortalEmail,
  readPortalChallengeValue,
} from '../../../../lib/security/customerPortalVerification'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = normalizePortalEmail(body?.email)
    const code = String(body?.code || '').trim()
    const challengeValue = request.cookies.get(CUSTOMER_PORTAL_CHALLENGE_COOKIE)?.value
    const challenge = readPortalChallengeValue(challengeValue)

    if (!email || !code) {
      return NextResponse.json(
        { ok: false, error: 'Email and verification code are required.' },
        { status: 400 }
      )
    }

    if (!challenge || isVerificationExpired(challenge.expiresAt)) {
      const response = NextResponse.json(
        { ok: false, error: 'Your verification code has expired. Please request a new code.' },
        { status: 400 }
      )
      response.cookies.set(
        CUSTOMER_PORTAL_CHALLENGE_COOKIE,
        '',
        getExpiredPortalCookieOptions()
      )
      return response
    }

    if (challenge.email !== email || challenge.code !== code) {
      return NextResponse.json(
        { ok: false, error: 'That verification code is not valid.' },
        { status: 400 }
      )
    }

    const sessionValue = createPortalSessionValue({
      email,
      expiresAt: getSessionExpiryTimestamp(),
    })

    const response = NextResponse.json({ ok: true, verified: true })
    response.cookies.set(
      CUSTOMER_PORTAL_SESSION_COOKIE,
      sessionValue,
      getPortalSessionCookieOptions()
    )
    response.cookies.set(
      CUSTOMER_PORTAL_CHALLENGE_COOKIE,
      '',
      getExpiredPortalCookieOptions()
    )

    return response
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Unable to verify the code right now.',
      },
      { status: 500 }
    )
  }
}
