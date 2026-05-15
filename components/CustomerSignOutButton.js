'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabase/browser'
import { useT } from '../lib/i18n/TranslationProvider'

export default function CustomerSignOutButton({ orgSlug }) {
  const router = useRouter()
  const t = useT()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.replace(`/shop/${orgSlug}/login`)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type='button'
      className='button button-secondary button-compact'
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? t('common.signingOut') : t('common.signOut')}
    </button>
  )
}
