'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabase/browser'

export default function AdminSignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
    setLoading(false)
  }

  return (
    <button type='button' className='button button-secondary button-compact' onClick={handleSignOut} disabled={loading}>
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
