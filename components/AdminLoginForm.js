'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '../lib/supabase/browser'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminLoginForm() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/admin/quotes'
  const queryError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabaseBrowser()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      router.replace(nextPath)
      router.refresh()
    } catch (submitError) {
      setError(submitError.message || t('adminLogin.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='page-hero'>
      <div className='site-shell'>
        <div className='policy-card center-card'>
          <div className='kicker'>{t('adminLogin.kicker')}</div>
          <h1>{t('adminLogin.heading')}</h1>
          <p>
            {t('adminLogin.introBefore')}{' '}
            <strong>{t('adminLogin.introProfiles')}</strong>{' '}
            {t('adminLogin.introMiddle')}{' '}
            <strong>{t('adminLogin.introAdmin')}</strong>{' '}
            {t('adminLogin.introOr')}{' '}
            <strong>{t('adminLogin.introTech')}</strong>
            {t('adminLogin.introAfter')}
          </p>

          <form onSubmit={handleSubmit} className='page-stack' style={{ marginTop: 24 }}>
            <div className='field'>
              <label htmlFor='admin-email'>{t('adminLogin.emailLabel')}</label>
              <input
                id='admin-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('adminLogin.emailPlaceholder')}
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='admin-password'>{t('adminLogin.passwordLabel')}</label>
              <input
                id='admin-password'
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('adminLogin.passwordPlaceholder')}
                required
              />
            </div>

            {queryError === 'unauthorized' ? (
              <div className='notice'>
                {t('adminLogin.noticeUnauthorized')}
              </div>
            ) : null}

            {error ? <div className='notice'>{error}</div> : null}

            <div className='inline-actions' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? t('adminLogin.signingIn') : t('adminLogin.submit')}
              </button>
              <LocalizedLink
                href='/admin/forgot-password'
                style={{ fontSize: '0.875rem', color: 'var(--muted)' }}
              >
                {t('adminLogin.forgotPassword')}
              </LocalizedLink>
            </div>
          </form>

          <div className='notice' style={{ marginTop: 20 }}>
            {t('adminLogin.longSetupBefore')}{' '}
            <strong>{t('adminLogin.longSetupProfiles')}</strong>{' '}
            {t('adminLogin.longSetupMiddle')}{' '}
            <strong>{t('adminLogin.longSetupAdmin')}</strong>{' '}
            {t('adminLogin.longSetupOr')}{' '}
            <strong>{t('adminLogin.longSetupTech')}</strong>
            {t('adminLogin.longSetupAfter')}
          </div>
        </div>
      </div>
    </div>
  )
}
