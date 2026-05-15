'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '../lib/supabase/browser'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminResetPasswordForm() {
  const t = useT()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // The recovery flow ships a session via the URL hash; supabase-js parses it
  // automatically. We just wait until a user is present before allowing the
  // password update so we don't surface the form to unauthenticated visitors.
  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseBrowser()

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (session?.user) {
        setReady(true)
      } else {
        setError(t('adminResetPassword.linkInvalid'))
        setReady(true)
      }
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
        setError('')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [t])

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 8) {
      setError(t('adminResetPassword.passwordTooShort'))
      return
    }
    if (password !== confirm) {
      setError(t('adminResetPassword.passwordMismatch'))
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowser()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
      // Brief pause so user sees the success state before redirect
      setTimeout(() => {
        router.replace('/admin/quotes')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err.message || t('adminResetPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <h1>{t('adminResetPassword.successTitle')}</h1>
            <p>{t('adminResetPassword.successBody')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='page-hero'>
      <div className='site-shell'>
        <div className='policy-card center-card'>
          <div className='kicker'>{t('adminResetPassword.kicker')}</div>
          <h1>{t('adminResetPassword.title')}</h1>
          <p>{t('adminResetPassword.subtitle')}</p>

          <form onSubmit={handleSubmit} className='page-stack' style={{ marginTop: 24 }}>
            <div className='field'>
              <label htmlFor='reset-password'>{t('adminResetPassword.passwordLabel')}</label>
              <input
                id='reset-password'
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='••••••••'
                autoComplete='new-password'
                required
                minLength={8}
              />
            </div>

            <div className='field'>
              <label htmlFor='reset-confirm'>{t('adminResetPassword.confirmLabel')}</label>
              <input
                id='reset-confirm'
                type='password'
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder='••••••••'
                autoComplete='new-password'
                required
                minLength={8}
              />
            </div>

            {error ? <div className='notice'>{error}</div> : null}

            <div className='inline-actions' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? t('adminResetPassword.saving') : t('adminResetPassword.submit')}
              </button>
              <LocalizedLink
                href='/admin/login'
                style={{ fontSize: '0.875rem', color: 'var(--muted)' }}
              >
                {t('adminResetPassword.backToLogin')}
              </LocalizedLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
