import { NextResponse } from 'next/server'
import {
  CUSTOMER_PORTAL_CHALLENGE_COOKIE,
  CUSTOMER_PORTAL_SESSION_COOKIE,
  getExpiredPortalCookieOptions,
} from '../../../../lib/security/customerPortalVerification'

export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ ok: true, signedOut: true })

  response.cookies.set(
    CUSTOMER_PORTAL_SESSION_COOKIE,
    '',
    getExpiredPortalCookieOptions()
  )
  response.cookies.set(
    CUSTOMER_PORTAL_CHALLENGE_COOKIE,
    '',
    getExpiredPortalCookieOptions()
  )

  return response
}
