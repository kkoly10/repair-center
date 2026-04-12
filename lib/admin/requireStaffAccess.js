import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const STAFF_ROLES = new Set(['admin', 'tech'])

export async function requireStaffAccess(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server auth is not configured for staff access.' },
      { status: 500 }
    )
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {
        // no-op for route checks
      },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Staff authentication is required.' }, { status: 401 })
  }

  const response = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(
      user.id
    )}&select=id,role,full_name&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to verify staff access.' }, { status: 500 })
  }

  const rows = await response.json()
  const profile = rows?.[0] || null

  if (!profile || !STAFF_ROLES.has(profile.role)) {
    return NextResponse.json({ error: 'Your account does not have staff access.' }, { status: 403 })
  }

  return { user, profile }
}
