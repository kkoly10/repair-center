'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LocalizedLink from '../../../lib/i18n/LocalizedLink'
import { useT } from '../../../lib/i18n/TranslationProvider'

export default function InvitePage() {
  const t = useT()
  const { token } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState('')

  function formatRole(role) {
    const map = {
      owner: t('invite.roleOwner'),
      admin: t('invite.roleAdmin'),
      tech: t('invite.roleTech'),
      viewer: t('invite.roleViewer'),
    }
    return map[role] || role || t('invite.roleUnknown')
  }

  useEffect(() => {
    let cancelled = false

    async function validateInvitation() {
      try {
        const res = await fetch(`/api/invitations/${token}`)
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok || json.valid === false) {
          setValidationError(json.reason || 'not_found')
        } else {
          setInvitation(json)
        }
        setLoading(false)
      } catch {
        if (!cancelled) {
          setValidationError('not_found')
          setLoading(false)
        }
      }
    }

    if (token) {
      validateInvitation()
    }
    return () => { cancelled = true }
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setAcceptError('')
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setAcceptError('unauthenticated')
        return
      }
      if (!res.ok) {
        throw new Error(json.error || t('invite.errFailed'))
      }
      router.replace('/admin')
    } catch (err) {
      setAcceptError(err.message || t('invite.errFailed'))
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>{t('invite.loading')}</div>
        </div>
      </main>
    )
  }

  if (validationError) {
    const messages = {
      not_found: t('invite.errInvalid'),
      expired: t('invite.errExpired'),
      already_accepted: t('invite.errUsed'),
    }
    const message = messages[validationError] || t('invite.errInvalid')
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='notice'>{message}</div>
        </div>
      </main>
    )
  }

  const orgName = invitation.orgName || invitation.org_name || t('invite.joinTeamFallback')

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>{t('invite.kicker')}</div>
          <h1>{t('invite.title', { orgName })}</h1>
          <p style={{ marginTop: 8 }}>
            {t('invite.bodyPrefix')}{' '}
            <strong>{orgName}</strong> {t('invite.bodyAs')}{' '}
            <strong>{formatRole(invitation.role)}</strong>.
          </p>
          <p className='muted' style={{ marginTop: 8 }}>
            {t('invite.signinFirst')}
          </p>

          {acceptError === 'unauthenticated' ? (
            <div className='notice' style={{ marginTop: 16 }}>
              {t('invite.pleaseSignIn')}{' '}
              <LocalizedLink
                href={`/admin/login?redirect=/invite/${token}`}
                style={{ color: '#2d6bff', fontWeight: 600 }}
              >
                {t('invite.signInLink')}
              </LocalizedLink>
            </div>
          ) : acceptError ? (
            <div className='notice' style={{ marginTop: 16 }}>{acceptError}</div>
          ) : null}

          <div style={{ marginTop: 20 }}>
            <button
              className='button'
              disabled={accepting}
              onClick={handleAccept}
            >
              {accepting ? t('invite.accepting') : t('invite.acceptButton')}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
