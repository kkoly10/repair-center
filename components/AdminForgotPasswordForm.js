'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabase/browser'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminForgotPasswordForm() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowser()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      // Always show the same success state to avoid leaking which emails are
      // registered. Errors from Supabase are still shown for transport-level
      // failures (network, rate limit) but not for "user not found".
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/admin/reset-password`,
      })
      setSent(true)
    } catch (err) {
      // Network or unexpected errors only — Supabase resetPasswordForEmail
      // does not throw for unknown emails.
      setError(err.message || t('adminForgotPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <div className='kicker'>{t('adminForgotPassword.kicker')}</div>
            <h1>{t('adminForgotPassword.sentTitle')}</h1>
            <p>{t('adminForgotPassword.sentBody')}</p>
            <LocalizedLink href='/admin/login' className='button button-secondary' style={{ marginTop: 16 }}>
              {t('adminForgotPassword.backToLogin')}
            </LocalizedLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='page-hero'>
      <div className='site-shell'>
        <div className='policy-card center-card'>
          <div className='kicker'>{t('adminForgotPassword.kicker')}</div>
          <h1>{t('adminForgotPassword.title')}</h1>
          <p>{t('adminForgotPassword.subtitle')}</p>

          <form onSubmit={handleSubmit} className='page-stack' style={{ marginTop: 24 }}>
            <div className='field'>
              <label htmlFor='forgot-email'>{t('adminForgotPassword.emailLabel')}</label>
              <input
                id='forgot-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('adminForgotPassword.emailPlaceholder')}
                required
              />
            </div>

            {error ? <div className='notice'>{error}</div> : null}

            <div className='inline-actions' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? t('adminForgotPassword.sending') : t('adminForgotPassword.submit')}
              </button>
              <LocalizedLink
                href='/admin/login'
                style={{ fontSize: '0.875rem', color: 'var(--muted)' }}
              >
                {t('adminForgotPassword.backToLogin')}
              </LocalizedLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
