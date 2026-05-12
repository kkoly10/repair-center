'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
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
      setError(signUpError.message || 'Failed to create account.')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>
            <div className='kicker'>Account created</div>
            <h1>Check your email</h1>
            <p>
              We sent a verification link to <strong>{email}</strong>. After verifying, visit{' '}
              <Link href='/admin/onboarding' style={{ color: '#2d6bff' }}>/admin/onboarding</Link> to set up your shop.
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
          <div className='kicker'>Get started</div>
          <h1>Create your account</h1>
          <p className='muted'>Sign up to open your repair shop.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type='text'
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                placeholder='Jane Smith'
                autoComplete='name'
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder='you@example.com'
                autoComplete='email'
              />
            </div>

            <div>
              <label style={labelStyle}>Password <span className='muted' style={{ fontWeight: 400, fontSize: '0.82rem' }}>(min 8 characters)</span></label>
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
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href='/admin/login' style={{ color: '#2d6bff' }}>
              Sign in at /admin/login
            </Link>
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
