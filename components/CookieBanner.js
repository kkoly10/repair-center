'use client'

import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n/TranslationProvider'
import {
  readConsent,
  writeConsent,
  clearConsent,
  hasMadeChoice,
} from '../lib/consent'

/**
 * GDPR-aware cookie banner.
 *
 * Renders at the bottom of the page when no consent choice has been made
 * (or when the visitor lands with `?consent=reset`, which clears the cookie
 * and re-shows the banner so users can change their mind from a help link).
 *
 * Stripe.js note: Stripe Checkout sets cookies on its own iframe domain
 * (js.stripe.com), not on this origin. EU regulators have ruled those
 * cookies are essential to the payment purpose (CNIL guidance, 2022), so
 * we treat them as "essential" and don't gate Stripe loading behind consent
 * — gating it would block customer payments and is not legally required.
 *
 * Supabase auth session cookies are likewise essential (sign-in / payment
 * flows). The locale cookie (NEXT_LOCALE) is essential because it drives
 * server-rendered content for the chosen language.
 *
 * Only Sentry browser SDK is gated behind the "analytics" toggle; see
 * `sentry.client.config.js` and `lib/sentryBrowser.js`.
 */
export default function CookieBanner() {
  const t = useT()
  // `null` while we figure out whether to render (avoids SSR flash). Becomes
  // true (show) or false (hide) after the mount effect runs.
  const [visible, setVisible] = useState(null)
  const [showCustomize, setShowCustomize] = useState(false)
  const [funcChecked, setFuncChecked] = useState(true)
  const [analyticsChecked, setAnalyticsChecked] = useState(false)

  useEffect(() => {
    // Allow "?consent=reset" anywhere in the app to wipe the choice and
    // re-show the banner. Useful as a footer/privacy-page link target.
    let resetRequested = false
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('consent') === 'reset') {
        clearConsent()
        resetRequested = true
      }
    } catch {
      // Older browsers / weird hosts — just fall through.
    }

    // Defer setState into a microtask so we don't violate React 19's
    // `react-hooks/set-state-in-effect` rule (no cascading renders).
    const id = setTimeout(() => {
      if (!resetRequested && hasMadeChoice()) {
        setVisible(false)
        return
      }
      // Initialize the toggles from any prior (now-cleared) preferences so a
      // user who hits `?consent=reset` doesn't lose their previous picks.
      const prior = readConsent()
      if (prior) {
        setFuncChecked(prior.functional)
        setAnalyticsChecked(prior.analytics)
      }
      setVisible(true)
    }, 0)
    return () => clearTimeout(id)
  }, [])

  if (visible !== true) return null

  function persistAndClose(prefs) {
    const written = writeConsent(prefs)
    setVisible(false)
    // If the user opted INTO analytics, reload so Sentry can initialize on
    // the next pageload (see lib/sentryBrowser.js for why we don't init
    // mid-session). If they opted OUT (or only changed essential/functional),
    // no reload needed — nothing was initialized that we need to tear down.
    if (written.analytics === true) {
      try {
        // Strip ?consent=reset from the URL when reloading, so it doesn't
        // immediately wipe the choice the user just made.
        const url = new URL(window.location.href)
        if (url.searchParams.has('consent')) {
          url.searchParams.delete('consent')
          window.location.replace(url.toString())
          return
        }
      } catch {
        // fall through to a plain reload
      }
      window.location.reload()
    }
  }

  function handleAcceptAll() {
    persistAndClose({ functional: true, analytics: true })
  }

  function handleEssentialOnly() {
    persistAndClose({ functional: false, analytics: false })
  }

  function handleSavePreferences() {
    persistAndClose({ functional: funcChecked, analytics: analyticsChecked })
  }

  return (
    <div
      role='dialog'
      aria-modal='false'
      aria-labelledby='cc-title'
      aria-describedby='cc-body'
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 9999,
        maxWidth: 680,
        margin: '0 auto',
        background: 'var(--surface, #ffffff)',
        color: 'var(--text, #1c1917)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 'var(--radius-lg, 14px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        padding: 18,
        fontSize: 14,
        lineHeight: 1.45,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <strong id='cc-title' style={{ fontSize: 15 }}>
          {t('cookieBanner.title')}
        </strong>
        <p id='cc-body' style={{ margin: 0, opacity: 0.85 }}>
          {t('cookieBanner.body')}
        </p>

        {showCustomize && (
          <div
            style={{
              marginTop: 4,
              padding: 12,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type='checkbox' checked disabled aria-readonly='true' />
                <strong>{t('cookieBanner.essentialLabel')}</strong>
              </span>
              <small style={{ opacity: 0.75, marginLeft: 26 }}>
                {t('cookieBanner.essentialDesc')}
              </small>
            </label>

            <label
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type='checkbox'
                  checked={funcChecked}
                  onChange={(e) => setFuncChecked(e.target.checked)}
                />
                <strong>{t('cookieBanner.functionalLabel')}</strong>
              </span>
              <small style={{ opacity: 0.75, marginLeft: 26 }}>
                {t('cookieBanner.functionalDesc')}
              </small>
            </label>

            <label
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type='checkbox'
                  checked={analyticsChecked}
                  onChange={(e) => setAnalyticsChecked(e.target.checked)}
                />
                <strong>{t('cookieBanner.analyticsLabel')}</strong>
              </span>
              <small style={{ opacity: 0.75, marginLeft: 26 }}>
                {t('cookieBanner.analyticsDesc')}
              </small>
            </label>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 4,
            alignItems: 'center',
          }}
        >
          {showCustomize ? (
            <button
              type='button'
              onClick={handleSavePreferences}
              style={primaryBtn}
            >
              {t('cookieBanner.savePreferences')}
            </button>
          ) : (
            <>
              <button
                type='button'
                onClick={handleAcceptAll}
                style={primaryBtn}
              >
                {t('cookieBanner.acceptAll')}
              </button>
              <button
                type='button'
                onClick={handleEssentialOnly}
                style={secondaryBtn}
              >
                {t('cookieBanner.essentialOnly')}
              </button>
              <button
                type='button'
                onClick={() => setShowCustomize(true)}
                style={ghostBtn}
              >
                {t('cookieBanner.customize')}
              </button>
            </>
          )}
          <a
            href='/data-privacy'
            data-privacy='true'
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              opacity: 0.7,
              textDecoration: 'underline',
              color: 'inherit',
            }}
          >
            {t('cookieBanner.privacyLink')}
          </a>
        </div>
      </div>
    </div>
  )
}

const primaryBtn = {
  background: 'var(--blue, #16a34a)',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryBtn = {
  background: 'transparent',
  color: 'inherit',
  border: '1px solid rgba(0,0,0,0.2)',
  padding: '8px 14px',
  borderRadius: 8,
  fontWeight: 500,
  cursor: 'pointer',
}

const ghostBtn = {
  background: 'transparent',
  color: 'inherit',
  border: 'none',
  padding: '8px 12px',
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'underline',
}
