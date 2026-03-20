'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '../lib/supabase/browser'

export default function AdminLoginForm() {
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
      setError(submitError.message || 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='page-hero'>
      <div className='site-shell'>
        <div className='policy-card center-card'>
          <div className='kicker'>Admin access</div>
          <h1>Sign in to review quotes</h1>
          <p>
            Use a staff account from Supabase Auth. The account must also have a matching row in
            <strong> profiles </strong>
            with role <strong>admin</strong> or <strong>tech</strong>.
          </p>

          <form onSubmit={handleSubmit} className='page-stack' style={{ marginTop: 24 }}>
            <div className='field'>
              <label htmlFor='admin-email'>Email address</label>
              <input
                id='admin-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='admin@example.com'
                required
              />
            </div>

            <div className='field'>
              <label htmlFor='admin-password'>Password</label>
              <input
                id='admin-password'
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='Password'
                required
              />
            </div>

            {queryError === 'unauthorized' ? (
              <div className='notice'>
                Your account exists, but it does not have admin or tech access yet.
              </div>
            ) : null}

            {error ? <div className='notice'>{error}</div> : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className='notice' style={{ marginTop: 20 }}>
            Long-term setup: create the staff user in Supabase Auth, then set that user’s row in
            <strong> public.profiles </strong>
            to role <strong>admin</strong> or <strong>tech</strong>.
          </div>
        </div>
      </div>
    </div>
  )
}