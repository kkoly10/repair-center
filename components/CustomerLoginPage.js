'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabase/browser'

export default function CustomerLoginPage({ orgSlug }) {
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
      setError(err.message || 'Unable to send login link right now.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className='page-hero'>
        <div className='site-shell'>
          <div className='info-card'>
            <div className='kicker'>Check your inbox</div>
            <h1>Magic link sent</h1>
            <p>
              We sent a sign-in link to <strong>{email}</strong>. Click the link in the email
              to access your account. The link expires in 60 minutes.
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
          <div className='kicker'>My Account</div>
          <h1>Sign in to view your repairs</h1>
          <p>
            Enter the email address you used when submitting your repair request.
            We&apos;ll send you a secure sign-in link — no password needed.
          </p>
        </div>

        <form className='policy-card' onSubmit={handleSubmit}>
          <div className='field'>
            <label htmlFor='customer-login-email'>Email address</label>
            <input
              id='customer-login-email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='name@example.com'
              required
            />
          </div>

          {error ? (
            <div className='notice notice-warn' style={{ marginTop: 14 }}>{error}</div>
          ) : null}

          <div className='inline-actions' style={{ marginTop: 16 }}>
            <button type='submit' className='button button-primary' disabled={loading}>
              {loading ? 'Sending…' : 'Send Sign-In Link'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
