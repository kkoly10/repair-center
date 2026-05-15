import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Extract /shop/<slug>/... from the next URL so we can scope customer linking
// to the shop the user actually signed in at. Without this, signing in at
// Shop A would auto-claim customer records with the same email at Shop B,
// Shop C, etc. — a tenant-boundary leak in the B2C model where multiple
// shops can legitimately have the same email address.
function extractOrgSlugFromNext(next) {
  if (!next || !next.startsWith('/shop/')) return null
  const segments = next.split('/').filter(Boolean) // ['shop', '<slug>', ...]
  if (segments.length < 2) return null
  const slug = segments[1]
  // Same character set the create-org slug regex enforces
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  return slug
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user) {
    return NextResponse.redirect(`${origin}/`)
  }

  const user = data.user
  const userEmail = user.email?.toLowerCase()

  const orgSlug = extractOrgSlugFromNext(next)

  if (userEmail && orgSlug) {
    // Resolve the org from the slug we extracted from the next URL.
    // Only link customers rows for THIS org — never auto-claim across tenants.
    const admin = getSupabaseAdmin()
    const { data: org } = await admin
      .from('organizations')
      .select('id, status')
      .eq('slug', orgSlug)
      .maybeSingle()

    if (org?.id && org.status !== 'suspended' && org.status !== 'cancelled') {
      // Escape SQL LIKE wildcards before the case-insensitive match
      const escapedEmail = userEmail.replace(/%/g, '\\%').replace(/_/g, '\\_')
      // Errors swallowed: linking failure must never block sign-in
      await admin
        .from('customers')
        .update({ auth_user_id: user.id })
        .eq('organization_id', org.id)
        .ilike('email', escapedEmail)
        .is('auth_user_id', null)
    }
  }
  // Note: when next has no org context, we intentionally do NOT auto-link.
  // The user can still sign in (Supabase auth succeeded above); they will
  // just not have customer-portal access until they sign in via a shop's
  // /shop/[slug]/login page that provides org context.

  // Validate next is a relative path to prevent open redirect
  const redirectTo = next.startsWith('/') ? `${origin}${next}` : origin
  return NextResponse.redirect(redirectTo)
}
