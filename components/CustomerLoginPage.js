'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabase/browser'
import { useT } from '../lib/i18n/TranslationProvider'

export default function CustomerLoginPage({ orgSlug }) {
  const t = useT()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabaseBrowser()
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const redirectTo = `${baseUrl}/api/auth/callback?next=/shop/${orgSlug}/account`

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      })

      if (otpError) throw otpError
      setSent(true)
    } catch (err) {
      setError(err.message || t('customerLogin.genericError'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='info-card'>
            <div className='kicker'>{t('customerLogin.kickerCheckInbox')}</div>
            <h1>{t('customerLogin.magicLinkSentTitle')}</h1>
            <p>
              {t('customerLogin.magicLinkSentBody', { email })}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('customerLogin.kickerAccount')}</div>
          <h1>{t('customerLogin.signInTitle')}</h1>
          <p>{t('customerLogin.signInDescription')}</p>
        </div>

        <form className='policy-card' onSubmit={handleSubmit}>
          <div className='field'>
            <label htmlFor='customer-login-email'>{t('customerLogin.emailAddressLabel')}</label>
            <input
              id='customer-login-email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('customerLogin.emailPlaceholder')}
              required
            />
          </div>

          {error ? (
            <div className='notice notice-warn' style={{ marginTop: 14 }}>{error}</div>
          ) : null}

          <div className='inline-actions' style={{ marginTop: 16 }}>
            <button type='submit' className='button button-primary' disabled={loading}>
              {loading ? t('customerLogin.sending') : t('customerLogin.submitButton')}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
