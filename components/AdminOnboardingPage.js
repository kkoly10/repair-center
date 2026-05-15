'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminOnboardingPage() {
  const t = useT()
  const router = useRouter()
  const [sessionChecked, setSessionChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [publicName, setPublicName] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession()
      if (cancelled) return
      if (error || !data.session) {
        router.replace('/admin/login')
        return
      }
      setAuthed(true)
      setSessionChecked(true)
    }

    checkSession()
    return () => { cancelled = true }
  }, [router])

  function deriveSlug(value) {
    return value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  function handleNameChange(e) {
    const value = e.target.value
    setName(value)
    setSlug(deriveSlug(value))
  }

  function handleSlugChange(e) {
    setSlug(deriveSlug(e.target.value))
    setSlugError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSlugError('')

    try {
      const res = await fetch('/api/auth/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          public_name: publicName || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json.error && /slug/i.test(json.error)) {
          setSlugError(json.error)
        } else {
          setError(json.error || t('adminOnboarding.errorGeneric'))
        }
        return
      }
      router.replace('/admin/quotes')
    } catch (err) {
      setError(err.message || t('adminOnboarding.somethingWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!sessionChecked) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>{t('adminOnboarding.loadingSession')}</div>
        </div>
      </main>
    )
  }

  if (!authed) {
    return null
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>{t('adminOnboarding.kicker')}</div>
          <h1>{t('adminOnboarding.heading')}</h1>
          <p className='muted'>{t('adminOnboarding.intro')}</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            <div>
              <label style={labelStyle}>{t('adminOnboarding.shopNameLabel')} <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type='text'
                required
                value={name}
                onChange={handleNameChange}
                style={inputStyle}
                placeholder={t('adminOnboarding.shopNamePlaceholder')}
              />
            </div>

            <div>
              <label style={labelStyle}>{t('adminOnboarding.slugLabel')} <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type='text'
                required
                value={slug}
                onChange={handleSlugChange}
                style={{ ...inputStyle, ...(slugError ? { borderColor: '#ef4444' } : {}) }}
                placeholder={t('adminOnboarding.slugPlaceholder')}
              />
              {slug && (
                <p className='muted' style={{ fontSize: '0.82rem', marginTop: 4 }}>
                  {t('adminOnboarding.slugHint')} <code>{slug}</code>
                </p>
              )}
              {slugError && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 4 }}>{slugError}</p>
              )}
            </div>

            <div>
              <label style={labelStyle}>{t('adminOnboarding.displayNameLabel')} <span className='muted' style={{ fontWeight: 400 }}>{t('adminOnboarding.displayNameOptional')}</span></label>
              <input
                type='text'
                value={publicName}
                onChange={(e) => setPublicName(e.target.value)}
                style={inputStyle}
                placeholder={t('adminOnboarding.displayNamePlaceholder')}
              />
            </div>

            {error && <div className='notice'>{error}</div>}

            <div>
              <button type='submit' className='button' disabled={submitting || !name || !slug}>
                {submitting ? t('adminOnboarding.submitting') : t('adminOnboarding.submitButton')}
              </button>
            </div>
          </form>
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
