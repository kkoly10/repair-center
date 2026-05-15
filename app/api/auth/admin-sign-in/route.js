import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { checkRateLimit } from '../../../../lib/rateLimiter'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// IP-based rate-limited admin sign-in. This route runs on the server so the
// Supabase session cookies are set via the cookie store handed to
// `createServerClient`. On success, the browser receives Set-Cookie headers
// and a subsequent router.refresh() will see the authenticated session.
//
// We never reveal whether an email exists — every failed sign-in returns a
// generic "Invalid email or password" message regardless of the underlying
// Supabase error.
export async function POST(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const { allowed } = await checkRateLimit(ip, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  // Same-origin defense: reject cross-origin POSTs outright. The browser
  // always sends Origin on cross-origin POSTs; same-origin form posts in
  // modern browsers also include it. Missing Origin (some bots) is allowed
  // through since rate limiting still applies.
  const origin = request.headers.get('origin')
  if (origin) {
    const host = request.headers.get('host')
    try {
      const u = new URL(origin)
      if (host && u.host !== host) {
        return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
    }
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 }
    )
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Authentication is not configured.' },
      { status: 500 }
    )
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data?.user) {
    // Generic message — never leak whether the email exists
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
