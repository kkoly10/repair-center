import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getPlatformSession() {
  const allowed = new Set(
    (process.env.PLATFORM_ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )
  if (allowed.size === 0) {
    throw Object.assign(new Error('Platform console is not configured.'), { status: 403 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !allowed.has(user.email.toLowerCase())) {
    throw Object.assign(new Error('Platform access denied.'), { status: 403 })
  }
  return user
}
