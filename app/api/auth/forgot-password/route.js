import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { checkRateLimit } from '../../../../lib/rateLimiter'

export const runtime = 'nodejs'

// Rate-limited password-reset email trigger. Always returns the same OK
// response shape (regardless of whether the email exists) to prevent
// account enumeration via timing or response bodies.
export async function POST(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const { allowed } = await checkRateLimit(ip, { maxRequests: 5, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const redirectTo = typeof body?.redirectTo === 'string' ? body.redirectTo : ''

  // Validate the redirect URL is on our origin (defense against open redirect)
  let finalRedirect = ''
  if (redirectTo) {
    try {
      const u = new URL(redirectTo)
      const origin = request.headers.get('origin') || ''
      if (origin && u.origin === origin) {
        finalRedirect = redirectTo
      }
    } catch {}
  }

  // Empty / malformed email — still return OK so the client can't probe.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  try {
    const supabase = getSupabaseAdmin()
    // resetPasswordForEmail does not throw for unknown emails by design.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: finalRedirect || undefined,
    })
  } catch {
    // Swallow errors; never reveal whether the email is registered.
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
