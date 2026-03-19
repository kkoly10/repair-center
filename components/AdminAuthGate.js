'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '../lib/supabase/browser'

export default function AdminAuthGate({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState({ loading: true, user: null, profile: null, error: null })

  useEffect(() => {
    let ignore = false
    const supabase = getSupabaseBrowser()

    async function loadSession() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        if (!ignore) {
          setState({ loading: false, user: null, profile: null, error: sessionError.message })
          router.replace('/admin/login')
        }
        return
      }

      const user = sessionData.session?.user || null

      if (!user) {
        if (!ignore) {
          setState({ loading: false, user: null, profile: null, error: null })
          router.replace(`/admin/login?next=${encodeURIComponent(pathname || '/admin/quotes')}`)
        }
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name, phone')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        if (!ignore) {
          setState({ loading: false, user, profile: null, error: profileError.message })
        }
        return
      }

      if (!profile || !['admin', 'tech'].includes(profile.role)) {
        await supabase.auth.signOut()
        if (!ignore) {
          setState({ loading: false, user: null, profile: null, error: 'Your account is not authorized for admin access.' })
          router.replace('/admin/login?error=unauthorized')
        }
        return
      }

      if (!ignore) {
        setState({ loading: false, user, profile, error: null })
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSession()
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [pathname, router])

  if (state.loading) {
    return (
      <div className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <div className='kicker'>Admin</div>
            <h1>Loading admin workspace…</h1>
            <p>Please wait while we verify your staff access.</p>
          </div>
        </div>
      </div>
    )
  }

  if (state.error && !state.profile) {
    return (
      <div className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <div className='kicker'>Admin</div>
            <h1>Access issue</h1>
            <p>{state.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return typeof children === 'function' ? children(state) : children
}
