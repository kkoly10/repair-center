'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.9rem',
  marginBottom: 6,
}

function formatRole(role) {
  const map = { owner: 'Owner', admin: 'Admin', tech: 'Technician', viewer: 'Viewer' }
  return map[role] || role || 'Unknown'
}

export default function InvitePage() {
  const { token } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState('')

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
      } catch (err) {
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
        throw new Error(json.error || 'Failed to accept invitation.')
      }
      router.replace('/admin')
    } catch (err) {
      setAcceptError(err.message || 'Failed to accept invitation.')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>Validating invitation...</div>
        </div>
      </main>
    )
  }

  if (validationError) {
    const messages = {
      not_found: 'This invitation link is invalid.',
      expired: 'This invitation has expired. Ask an admin to resend it.',
      already_accepted: 'This invitation has already been used.',
    }
    const message = messages[validationError] || 'This invitation link is invalid.'
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='notice'>{message}</div>
        </div>
      </main>
    )
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='policy-card'>
          <div className='kicker'>You&rsquo;re invited</div>
          <h1>Join {invitation.orgName || invitation.org_name || 'the team'}</h1>
          <p style={{ marginTop: 8 }}>
            You&rsquo;ve been invited to join{' '}
            <strong>{invitation.orgName || invitation.org_name}</strong> as{' '}
            <strong>{formatRole(invitation.role)}</strong>.
          </p>
          <p className='muted' style={{ marginTop: 8 }}>
            Sign in or create an account, then click Accept below.
          </p>

          {acceptError === 'unauthenticated' ? (
            <div className='notice' style={{ marginTop: 16 }}>
              Please sign in first.{' '}
              <Link
                href={`/admin/login?redirect=/invite/${token}`}
                style={{ color: '#2d6bff', fontWeight: 600 }}
              >
                Sign in
              </Link>
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
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
