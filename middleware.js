import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const STAFF_ROLES = new Set(['admin', 'tech'])
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login'])

export async function middleware(request) {
  const pathname = request.nextUrl.pathname
  const isAdminApi = pathname.startsWith('/admin/api/')
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.has(pathname)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return rejectUnauthorized(request, {
      isAdminApi,
      status: 500,
      message: 'Supabase auth is not configured for middleware protection.',
    })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    if (isPublicAdminPath) return response

    return rejectUnauthorized(request, {
      isAdminApi,
      status: 401,
      message: 'Staff authentication is required.',
    })
  }

  const staffRole = await fetchStaffRole(user.id)

  if (!STAFF_ROLES.has(staffRole)) {
    if (isPublicAdminPath) return response

    return rejectUnauthorized(request, {
      isAdminApi,
      status: 403,
      message: 'Your account does not have staff access.',
    })
  }

  if (isPublicAdminPath) {
    return NextResponse.redirect(new URL('/admin/quotes', request.url))
  }

  return response
}

async function fetchStaffRole(userId) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) return null

  const restUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(
    userId
  )}&select=role&limit=1`

  const response = await fetch(restUrl, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) return null

  const rows = await response.json()
  return rows?.[0]?.role || null
}

function rejectUnauthorized(request, { isAdminApi, status, message }) {
  if (isAdminApi) {
    return NextResponse.json({ error: message }, { status })
  }

  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('next', request.nextUrl.pathname)

  if (status === 403) {
    loginUrl.searchParams.set('error', 'unauthorized')
  }

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
