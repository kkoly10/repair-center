'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '../lib/supabase/browser'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

// Phases:
//   'pending'  — checking the recovery session (shows loading)
//   'recovery' — confirmed recovery session present, show form
//   'invalid'  — no session and PASSWORD_RECOVERY event never fired
//   'logged-in'— there is a normal (non-recovery) session, send them away
const RECOVERY_GRACE_MS = 1500

export default function AdminResetPasswordForm() {
  const t = useT()
  const router = useRouter()
  const [phase, setPhase] = useState('pending')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // The recovery flow ships a session via the URL hash; supabase-js parses it
  // asynchronously and emits PASSWORD_RECOVERY when ready. We listen for that
  // event AND poll getSession() with a short grace period before deciding the
  // link is invalid — otherwise we race the SDK and flash an error.
  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseBrowser()
    let recoverySeen = false
    let timeoutId = null

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY') {
        recoverySeen = true
        setPhase('recovery')
        setError('')
      } else if (event === 'SIGNED_OUT') {
        setPhase('invalid')
      }
    })

    async function initialCheck() {
      // If the URL has no recovery hash AND no recovery event has fired by the
      // grace window, we treat it as an invalid/expired link. If a session
      // exists but it's a normal admin session (not recovery), redirect them
      // away — this page should not be a back-door password change.
      const hasRecoveryHash =
        typeof window !== 'undefined' &&
        /access_token=.*&type=recovery/.test(window.location.hash)

      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (recoverySeen) return // listener already handled it

      if (hasRecoveryHash) {
        // Wait for PASSWORD_RECOVERY; SDK is still parsing the fragment
        timeoutId = setTimeout(() => {
          if (!cancelled && !recoverySeen) {
            setPhase('invalid')
            setError(t('adminResetPassword.linkInvalid'))
          }
        }, RECOVERY_GRACE_MS)
        return
      }

      if (session?.user) {
        // Logged-in admin who arrived here without a recovery link.
        // Don't expose a free password-change endpoint.
        setPhase('logged-in')
        return
      }

      setPhase('invalid')
      setError(t('adminResetPassword.linkInvalid'))
    }

    initialCheck()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
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

  if (phase === 'pending') {
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

  if (phase === 'logged-in') {
    return (
      <div className='page-hero'>
        <div className='site-shell'>
          <div className='policy-card center-card'>
            <div className='kicker'>{t('adminResetPassword.kicker')}</div>
            <h1>{t('adminResetPassword.alreadyLoggedInTitle')}</h1>
            <p>{t('adminResetPassword.alreadyLoggedInBody')}</p>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <LocalizedLink href='/admin/quotes' className='button button-primary'>
                {t('adminResetPassword.goToDashboard')}
              </LocalizedLink>
            </div>
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
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <LocalizedLink href='/admin/quotes' className='button button-primary'>
                {t('adminResetPassword.goToDashboard')}
              </LocalizedLink>
            </div>
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
                disabled={phase === 'invalid'}
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
                disabled={phase === 'invalid'}
              />
            </div>

            {error ? <div className='notice'>{error}</div> : null}

            <div className='inline-actions' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type='submit'
                className='button button-primary'
                disabled={loading || phase === 'invalid'}
              >
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
