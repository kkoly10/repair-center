'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '../lib/supabase/browser'

export default function StaffAuthActions({ mobile = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let ignore = false
    const supabase = getSupabaseBrowser()

    async function loadSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const user = session?.user

        if (!user) {
          if (!ignore) {
            setIsStaff(false)
            setLoading(false)
          }
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!ignore) {
          setIsStaff(!!profile && ['admin', 'tech'].includes(profile.role))
          setLoading(false)
        }
      } catch {
        if (!ignore) {
          setIsStaff(false)
          setLoading(false)
        }
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
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } finally {
      setSigningOut(false)
      setIsStaff(false)
    }
  }

  if (loading) {
    return mobile ? null : (
      <span className='button button-ghost button-compact' aria-hidden='true'>
        ...
      </span>
    )
  }

  if (!isStaff) {
    return (
      <Link
        href='/login'
        className={mobile ? 'button button-ghost' : 'button button-ghost button-compact'}
      >
        Staff Login
      </Link>
    )
  }

  return (
    <>
      <Link
        href='/admin/quotes'
        className={mobile ? 'button button-secondary' : 'button button-secondary button-compact'}
      >
        Admin Dashboard
      </Link>
      <button
        type='button'
        onClick={handleSignOut}
        disabled={signingOut}
        className={mobile ? 'button button-ghost' : 'button button-ghost button-compact'}
      >
        {signingOut ? 'Logging out…' : 'Logout'}
      </button>
    </>
  )
}