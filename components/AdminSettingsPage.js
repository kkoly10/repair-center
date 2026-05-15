'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import { useT } from '../lib/i18n/TranslationProvider'

export default function AdminSettingsPage() {
  return (
    <AdminAuthGate>
      <AdminSettingsPageInner />
    </AdminAuthGate>
  )
}

function AdminSettingsPageInner() {
  const t = useT()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')

  // Section 1 — Business Info
  const [orgName, setOrgName] = useState('')
  const [orgPublicName, setOrgPublicName] = useState('')
  const [orgSupportEmail, setOrgSupportEmail] = useState('')
  const [orgSupportPhone, setOrgSupportPhone] = useState('')
  const [savingOrg, setSavingOrg] = useState(false)
  const [savedOrg, setSavedOrg] = useState(false)
  const [errorOrg, setErrorOrg] = useState('')

  // Section 2 — Receiving Address
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [mailInEnabled, setMailInEnabled] = useState(false)
  const [packingChecklist, setPackingChecklist] = useState('')
  const [shippingNotes, setShippingNotes] = useState('')
  const [savingAddress, setSavingAddress] = useState(false)
  const [savedAddress, setSavedAddress] = useState(false)
  const [errorAddress, setErrorAddress] = useState('')

  // Section 3 — Branding
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2d6bff')
  const [accentColor, setAccentColor] = useState('#16a34a')
  const [heroHeadline, setHeroHeadline] = useState('')
  const [heroSubheadline, setHeroSubheadline] = useState('')
  const [savingBranding, setSavingBranding] = useState(false)
  const [savedBranding, setSavedBranding] = useState(false)
  const [errorBranding, setErrorBranding] = useState('')

  // Section 4 — Payment Settings
  const [paymentMode, setPaymentMode] = useState('manual')
  const [manualPaymentInstructions, setManualPaymentInstructions] = useState('')
  const [cashappTag, setCashappTag] = useState('')
  const [zelleContact, setZelleContact] = useState('')
  const [squarePaymentUrl, setSquarePaymentUrl] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)
  const [savedPayment, setSavedPayment] = useState(false)
  const [errorPayment, setErrorPayment] = useState('')
  const [connectStatus, setConnectStatus] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSettings() {
      try {
        const [response, connectRes] = await Promise.all([
          fetch('/admin/api/settings'),
          fetch('/admin/api/billing/connect/status').catch(() => null),
        ])
        if (!response.ok) throw new Error(t('adminSettings.loadFailed'))
        const json = await response.json()
        if (!cancelled) {
          setData(json)

          if (connectRes) {
            connectRes.json().then((c) => { if (!c.error) setConnectStatus(c) }).catch(() => {})
          }

          const org = json.org || {}
          setOrgSlug(org.slug || '')
          setOrgName(org.name || '')
          setOrgPublicName(org.public_name || '')
          setOrgSupportEmail(org.support_email || '')
          setOrgSupportPhone(org.support_phone || '')

          const settings = json.settings || {}
          setLine1(settings.receiving_line1 || '')
          setLine2(settings.receiving_line2 || '')
          setCity(settings.receiving_city || '')
          setState(settings.receiving_state || '')
          setPostalCode(settings.receiving_postal_code || '')
          setMailInEnabled(settings.mail_in_enabled || false)
          setPackingChecklist(
            Array.isArray(settings.packing_checklist)
              ? settings.packing_checklist.join('\n')
              : settings.packing_checklist || ''
          )
          setShippingNotes(
            Array.isArray(settings.shipping_notes)
              ? settings.shipping_notes.join('\n')
              : settings.shipping_notes || ''
          )

          const branding = json.branding || {}
          setLogoUrl(branding.logo_url || '')
          setPrimaryColor(branding.primary_color || '#2d6bff')
          setAccentColor(branding.accent_color || '#16a34a')
          setHeroHeadline(branding.hero_headline || '')
          setHeroSubheadline(branding.hero_subheadline || '')

          const payment = json.payment || {}
          setPaymentMode(payment.payment_mode || 'manual')
          setManualPaymentInstructions(payment.manual_payment_instructions || '')
          setCashappTag(payment.cashapp_tag || '')
          setZelleContact(payment.zelle_contact || '')
          setSquarePaymentUrl(payment.square_payment_url || '')

          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t('adminSettings.loadFailed'))
          setLoading(false)
        }
      }
    }

    fetchSettings()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveOrg(e) {
    e.preventDefault()
    setSavingOrg(true)
    setErrorOrg('')
    setSavedOrg(false)
    try {
      const res = await fetch('/admin/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org: {
            name: orgName,
            public_name: orgPublicName,
            support_email: orgSupportEmail,
            support_phone: orgSupportPhone,
          },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || t('adminSettings.saveBusinessFailed'))
      }
      setSavedOrg(true)
      setTimeout(() => setSavedOrg(false), 3000)
    } catch (err) {
      setErrorOrg(err.message || t('adminSettings.saveBusinessFailed'))
    } finally {
      setSavingOrg(false)
    }
  }

  async function handleSaveAddress(e) {
    e.preventDefault()
    setSavingAddress(true)
    setErrorAddress('')
    setSavedAddress(false)
    try {
      const res = await fetch('/admin/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            receiving_line1: line1,
            receiving_line2: line2,
            receiving_city: city,
            receiving_state: state,
            receiving_postal_code: postalCode,
            mail_in_enabled: mailInEnabled,
            packing_checklist: packingChecklist.split('\n').filter(Boolean),
            shipping_notes: shippingNotes.split('\n').filter(Boolean),
          },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || t('adminSettings.saveAddressFailed'))
      }
      setSavedAddress(true)
      setTimeout(() => setSavedAddress(false), 3000)
    } catch (err) {
      setErrorAddress(err.message || t('adminSettings.saveAddressFailed'))
    } finally {
      setSavingAddress(false)
    }
  }

  async function handleSaveBranding(e) {
    e.preventDefault()
    setSavingBranding(true)
    setErrorBranding('')
    setSavedBranding(false)
    try {
      const res = await fetch('/admin/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branding: {
            logo_url: logoUrl,
            primary_color: primaryColor,
            accent_color: accentColor,
            hero_headline: heroHeadline,
            hero_subheadline: heroSubheadline,
          },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || t('adminSettings.saveBrandingFailed'))
      }
      setSavedBranding(true)
      setTimeout(() => setSavedBranding(false), 3000)
    } catch (err) {
      setErrorBranding(err.message || t('adminSettings.saveBrandingFailed'))
    } finally {
      setSavingBranding(false)
    }
  }

  async function handleSavePayment(e) {
    e.preventDefault()
    setSavingPayment(true)
    setErrorPayment('')
    setSavedPayment(false)
    try {
      const res = await fetch('/admin/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment: {
            payment_mode: paymentMode,
            manual_payment_instructions: manualPaymentInstructions,
            cashapp_tag: cashappTag,
            zelle_contact: zelleContact,
            square_payment_url: squarePaymentUrl,
          },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || t('adminSettings.savePaymentFailed'))
      }
      setSavedPayment(true)
      setTimeout(() => setSavedPayment(false), 3000)
    } catch (err) {
      setErrorPayment(err.message || t('adminSettings.savePaymentFailed'))
    } finally {
      setSavingPayment(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>{t('adminSettings.loading')}</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='notice'>{error}</div>
        </div>
      </main>
    )
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        <div className='info-card'>
          <div className='kicker'>{t('adminSettings.kicker')}</div>
          <h1>{t('adminSettings.title')}</h1>
        </div>

        {/* Shop Links */}
        {orgSlug && (
          <div className='policy-card'>
            <h2 style={{ marginBottom: 12 }}>{t('adminSettings.shopLinkTitle')}</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href={`/shop/${orgSlug}`}
                target='_blank'
                rel='noreferrer'
                className='button button-secondary button-compact'
              >
                {t('adminSettings.previewShop')}
              </a>
              <a
                href={`/shop/${orgSlug}/estimate`}
                target='_blank'
                rel='noreferrer'
                className='button button-secondary button-compact'
              >
                {t('adminSettings.previewEstimate')}
              </a>
              <button
                type='button'
                className='button button-secondary button-compact'
                onClick={() => {
                  const url = `${window.location.origin}/shop/${orgSlug}`
                  navigator.clipboard.writeText(url).then(() => {
                    setCopyFeedback(t('adminSettings.copied'))
                    setTimeout(() => setCopyFeedback(''), 2000)
                  })
                }}
              >
                {copyFeedback || t('adminSettings.copyShopLink')}
              </button>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: 10 }}>
              {t('adminSettings.publicUrlLabel')} <code style={{ fontSize: '0.82rem' }}>/shop/{orgSlug}</code>
            </p>
          </div>
        )}

        {/* Section 1 — Business Info */}
        <div className='policy-card'>
          <h2>{t('adminSettings.businessInfoTitle')}</h2>
          <form onSubmit={handleSaveOrg} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>{t('adminSettings.businessNameLabel')}</label>
              <input
                type='text'
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.businessNamePlaceholder')}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.displayNameLabel')}</label>
              <input
                type='text'
                value={orgPublicName}
                onChange={(e) => setOrgPublicName(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.displayNamePlaceholder')}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.supportEmail')}</label>
              <input
                type='email'
                value={orgSupportEmail}
                onChange={(e) => setOrgSupportEmail(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.supportEmailPlaceholder')}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.supportPhone')}</label>
              <input
                type='text'
                value={orgSupportPhone}
                onChange={(e) => setOrgSupportPhone(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.supportPhonePlaceholder')}
              />
            </div>
            {errorOrg && <div className='notice'>{errorOrg}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type='submit' className='button' disabled={savingOrg}>
                {savingOrg ? t('adminSettings.savingDots') : t('adminSettings.saveBusinessInfo')}
              </button>
              {savedOrg && <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('adminSettings.savedExclaim')}</span>}
            </div>
          </form>
        </div>

        {/* Section 2 — Receiving Address */}
        <div className='policy-card'>
          <h2>{t('adminSettings.receivingTitleFull')}</h2>
          <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>{t('adminSettings.addressLine1')}</label>
              <input
                type='text'
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.addressLine1Placeholder')}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.addressLine2')}</label>
              <input
                type='text'
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.addressLine2Placeholder')}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', gap: 12 }}>
              <div>
                <label style={labelStyle}>{t('adminSettings.city')}</label>
                <input
                  type='text'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                  placeholder={t('adminSettings.cityPlaceholder')}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('adminSettings.state')}</label>
                <input
                  type='text'
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={inputStyle}
                  placeholder={t('adminSettings.statePlaceholder')}
                  maxLength={2}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('adminSettings.postalCode')}</label>
                <input
                  type='text'
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  style={inputStyle}
                  placeholder={t('adminSettings.postalCodePlaceholder')}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type='checkbox'
                id='mail-in-enabled'
                checked={mailInEnabled}
                onChange={(e) => setMailInEnabled(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor='mail-in-enabled' style={{ fontWeight: 600, cursor: 'pointer' }}>
                {t('adminSettings.mailInEnabledLabel')}
              </label>
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.packingChecklistLabel')}</label>
              <textarea
                value={packingChecklist}
                onChange={(e) => setPackingChecklist(e.target.value)}
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                placeholder={t('adminSettings.packingChecklistPlaceholder')}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.shippingNotesLabel')}</label>
              <textarea
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder={t('adminSettings.shippingNotesPlaceholder')}
              />
            </div>
            {errorAddress && <div className='notice'>{errorAddress}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type='submit' className='button' disabled={savingAddress}>
                {savingAddress ? t('adminSettings.savingDots') : t('adminSettings.saveAddressButton')}
              </button>
              {savedAddress && <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('adminSettings.savedExclaim')}</span>}
            </div>
          </form>
        </div>

        {/* Section 3 — Branding */}
        <div className='policy-card'>
          <h2>{t('adminSettings.brandingTitleSimple')}</h2>
          <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>{t('adminSettings.logoUrl')}</label>
              <input
                type='text'
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.logoUrlPlaceholder')}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t('adminSettings.primaryColor')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type='color'
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: 44, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type='text'
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder='#2d6bff'
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t('adminSettings.accentColor')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type='color'
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: 44, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type='text'
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder='#16a34a'
                  />
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.heroHeadlineLabel')}</label>
              <input
                type='text'
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.heroHeadlinePlaceholder')}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('adminSettings.heroSubheadlineLabel')}</label>
              <input
                type='text'
                value={heroSubheadline}
                onChange={(e) => setHeroSubheadline(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.heroSubheadlinePlaceholder')}
              />
            </div>
            {errorBranding && <div className='notice'>{errorBranding}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type='submit' className='button' disabled={savingBranding}>
                {savingBranding ? t('adminSettings.savingDots') : t('adminSettings.saveBrandingButton')}
              </button>
              {savedBranding && <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('adminSettings.savedExclaim')}</span>}
            </div>
          </form>
        </div>

        {/* Section 4 — Payment Settings */}
        <div className='policy-card'>
          <h2>{t('adminSettings.paymentTitleFull')}</h2>
          <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>{t('adminSettings.paymentMode')}</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={inputStyle}
              >
                <option value='manual'>{t('adminSettings.paymentModeManualOption')}</option>
                <option value='platform_stripe'>{t('adminSettings.paymentModePlatformOption')}</option>
                <option value='stripe_connect'>{t('adminSettings.paymentModeConnectOption')}</option>
              </select>
              <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: 6 }}>
                {t('adminSettings.paymentModeHint')}
              </p>
              {paymentMode === 'stripe_connect' && connectStatus && !connectStatus.connected && (
                <p className='notice-warn' style={{ marginTop: 8, fontSize: '0.85rem' }}>
                  {t('adminSettings.connectFirstHintPrefix')} <a href='/admin/billing'>{t('adminSettings.connectFirstHintLink')}</a>{t('adminSettings.connectFirstHintSuffix')}
                </p>
              )}
              {paymentMode === 'stripe_connect' && connectStatus?.connected && !connectStatus.chargesEnabled && (
                <p className='notice-warn' style={{ marginTop: 8, fontSize: '0.85rem' }}>
                  {t('adminSettings.connectIncompleteSettings')} <a href='/admin/billing'>{t('adminSettings.connectIncompleteLink')}</a>
                </p>
              )}
              {paymentMode === 'stripe_connect' && connectStatus?.connected && connectStatus.chargesEnabled && (
                <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--success)' }}>
                  {t('adminSettings.connectReady')}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>{t('adminSettings.manualInstructionsLabel')}</label>
              <textarea
                value={manualPaymentInstructions}
                onChange={(e) => setManualPaymentInstructions(e.target.value)}
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                placeholder={t('adminSettings.manualInstructionsPlaceholder')}
              />
              <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: 4 }}>
                {t('adminSettings.manualInstructionsHint')}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t('adminSettings.cashappTagLabel')}</label>
                <input
                  type='text'
                  value={cashappTag}
                  onChange={(e) => setCashappTag(e.target.value)}
                  style={inputStyle}
                  placeholder={t('adminSettings.cashappTagPlaceholder')}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('adminSettings.zelleContactLabel')}</label>
                <input
                  type='text'
                  value={zelleContact}
                  onChange={(e) => setZelleContact(e.target.value)}
                  style={inputStyle}
                  placeholder={t('adminSettings.zelleContactPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t('adminSettings.squarePaymentLinkLabel')}</label>
              <input
                type='url'
                value={squarePaymentUrl}
                onChange={(e) => setSquarePaymentUrl(e.target.value)}
                style={inputStyle}
                placeholder={t('adminSettings.squarePaymentLinkPlaceholder')}
              />
            </div>

            {errorPayment && <div className='notice'>{errorPayment}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type='submit' className='button' disabled={savingPayment}>
                {savingPayment ? t('adminSettings.savingDots') : t('adminSettings.savePaymentButton')}
              </button>
              {savedPayment && <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('adminSettings.savedExclaim')}</span>}
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
