import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  detectLocaleFromAcceptLanguage,
  isLocale,
} from './lib/i18n/config'

function extractLocale(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length > 0 && isLocale(segments[0])) {
    return { locale: segments[0], rest: '/' + segments.slice(1).join('/') }
  }
  return { locale: null, rest: pathname }
}

function shouldSkipLocale(pathname) {
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/admin/api/')) return true
  if (pathname.startsWith('/platform/api/')) return true
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/favicon.ico') return true
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true
  return false
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname

  // Step 1: Locale resolution and rewrite
  let activeLocale = DEFAULT_LOCALE
  let response

  if (shouldSkipLocale(pathname)) {
    response = NextResponse.next({ request: { headers: request.headers } })
  } else {
    const { locale: pathLocale, rest } = extractLocale(pathname)
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
    const headerLocale = detectLocaleFromAcceptLanguage(request.headers.get('accept-language'))

    if (pathLocale) {
      activeLocale = pathLocale
      // Rewrite internally so existing app routes (which are NOT under /[locale]/) handle the request
      const url = request.nextUrl.clone()
      url.pathname = rest === '' ? '/' : rest
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-locale', activeLocale)
      response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      // Persist user's choice
      response.cookies.set(LOCALE_COOKIE, activeLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
    } else {
      activeLocale = isLocale(cookieLocale) ? cookieLocale : headerLocale
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-locale', activeLocale)
      response = NextResponse.next({ request: { headers: requestHeaders } })
      // Persist detected locale if cookie absent
      if (!cookieLocale) {
        response.cookies.set(LOCALE_COOKIE, activeLocale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        })
      }
    }
  }

  // Step 2: Admin auth (after rewrite, check internal pathname rather than URL)
  // Use the canonical (locale-stripped) pathname for admin gating
  const { rest: canonicalPath } = extractLocale(pathname)
  const isAdminPath = canonicalPath.startsWith('/admin')

  if (!isAdminPath) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const isAdminLogin = canonicalPath === '/admin/login'
  const isBlockedStatusBypass =
    canonicalPath === '/admin/suspended' || canonicalPath.startsWith('/admin/billing')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isAdminLogin) {
    return response
  }

  function localizedRedirect(target) {
    const localePrefix = activeLocale === DEFAULT_LOCALE ? '' : `/${activeLocale}`
    return NextResponse.redirect(new URL(`${localePrefix}${target}`, request.url))
  }

  if (!user) {
    const localePrefix = activeLocale === DEFAULT_LOCALE ? '' : `/${activeLocale}`
    const loginUrl = new URL(`${localePrefix}/admin/login`, request.url)
    loginUrl.searchParams.set('next', canonicalPath)
    return NextResponse.redirect(loginUrl)
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role, organization_id, organizations(status, trial_ends_at)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin', 'tech'])
    .maybeSingle()

  if (!membership) {
    const localePrefix = activeLocale === DEFAULT_LOCALE ? '' : `/${activeLocale}`
    const loginUrl = new URL(`${localePrefix}/admin/login`, request.url)
    loginUrl.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(loginUrl)
  }

  const BLOCKED_STATUSES = new Set(['suspended', 'cancelled'])
  const orgStatus = membership.organizations?.status
  const trialEndsAt = membership.organizations?.trial_ends_at

  const trialExpired = orgStatus === 'trialing' && trialEndsAt && new Date(trialEndsAt) < new Date()

  if ((trialExpired || (orgStatus && BLOCKED_STATUSES.has(orgStatus))) && !isBlockedStatusBypass) {
    return localizedRedirect('/admin/suspended')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
