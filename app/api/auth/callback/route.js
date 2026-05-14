import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

  if (userEmail) {
    // Link any unlinked customer rows that share this email across all orgs.
    // The composite unique (auth_user_id, organization_id) prevents duplicate links
    // even if this runs multiple times. Errors are intentionally swallowed so a
    // linking failure never blocks the customer from signing in.
    // Escape SQL LIKE wildcards before the case-insensitive match to prevent
    // a crafted email address from matching unintended customer rows.
    const escapedEmail = userEmail.replace(/%/g, '\\%').replace(/_/g, '\\_')
    await getSupabaseAdmin()
      .from('customers')
      .update({ auth_user_id: user.id })
      .ilike('email', escapedEmail)
      .is('auth_user_id', null)
  }

  // Validate next is a relative path to prevent open redirect
  const redirectTo = next.startsWith('/') ? `${origin}${next}` : origin
  return NextResponse.redirect(redirectTo)
}
