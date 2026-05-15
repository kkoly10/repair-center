'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function SignupForm() {
  const t = useT()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError(t('signup.passwordTooShort'))
      return
    }
    setSubmitting(true)
    setError('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message || t('signup.error'))
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>
            <div className='kicker'>{t('signup.successKicker')}</div>
            <h1>{t('signup.successTitle')}</h1>
            <p>
              {t('signup.successBody1')} <strong>{email}</strong>. {t('signup.successBody2')}{' '}
              <LocalizedLink href='/admin/onboarding' style={{ color: '#2d6bff' }}>/admin/onboarding</LocalizedLink>.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>{t('signup.kicker')}</div>
          <h1>{t('signup.title')}</h1>
          <p className='muted'>{t('signup.subtitle')}</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            <div>
              <label style={labelStyle}>{t('signup.ownerName')}</label>
              <input
                type='text'
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                placeholder={t('signup.namePlaceholder')}
                autoComplete='name'
              />
            </div>

            <div>
              <label style={labelStyle}>{t('signup.ownerEmail')}</label>
              <input
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder={t('signup.emailPlaceholder')}
                autoComplete='email'
              />
            </div>

            <div>
              <label style={labelStyle}>
                {t('signup.password')}{' '}
                <span className='muted' style={{ fontWeight: 400, fontSize: '0.82rem' }}>{t('signup.passwordHint')}</span>
              </label>
              <input
                type='password'
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder='••••••••'
                autoComplete='new-password'
              />
            </div>

            {error && <div className='notice'>{error}</div>}

            <div>
              <button type='submit' className='button' disabled={submitting}>
                {submitting ? t('signup.submitting') : t('signup.submit')}
              </button>
            </div>
          </form>

          <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--muted)' }}>
            {t('signup.haveAccount')}{' '}
            <LocalizedLink href='/admin/login' style={{ color: '#2d6bff' }}>
              {t('signup.signinLink')}
            </LocalizedLink>
          </p>
        </div>
      </div>
    </main>
  )
}

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.9rem',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: '0.95rem',
  boxSizing: 'border-box',
}
