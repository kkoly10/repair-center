'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'

export default function AdminSettingsPage() {
  return (
    <AdminAuthGate>
      <AdminSettingsPageInner />
    </AdminAuthGate>
  )
}

function AdminSettingsPageInner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  useEffect(() => {
    let cancelled = false

    async function fetchSettings() {
      try {
        const response = await fetch('/admin/api/settings')
        if (!response.ok) throw new Error('Failed to load settings.')
        const json = await response.json()
        if (!cancelled) {
          setData(json)

          const org = json.org || {}
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

          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load settings.')
          setLoading(false)
        }
      }
    }

    fetchSettings()
    return () => { cancelled = true }
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
        throw new Error(json.error || 'Failed to save business info.')
      }
      setSavedOrg(true)
      setTimeout(() => setSavedOrg(false), 3000)
    } catch (err) {
      setErrorOrg(err.message || 'Failed to save business info.')
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
        throw new Error(json.error || 'Failed to save address & instructions.')
      }
      setSavedAddress(true)
      setTimeout(() => setSavedAddress(false), 3000)
    } catch (err) {
      setErrorAddress(err.message || 'Failed to save address & instructions.')
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
        throw new Error(json.error || 'Failed to save branding.')
      }
      setSavedBranding(true)
      setTimeout(() => setSavedBranding(false), 3000)
    } catch (err) {
      setErrorBranding(err.message || 'Failed to save branding.')
    } finally {
      setSavingBranding(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>Loading settings...</div>
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

        {/* Section 1 — Business Info */}
        <div className='policy-card'>
          <h2>Business Info</h2>
          <form onSubmit={handleSaveOrg} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input
                type='text'
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                style={inputStyle}
                placeholder='Your legal or DBA business name'
              />
            </div>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                type='text'
                value={orgPublicName}
                onChange={(e) => setOrgPublicName(e.target.value)}
                style={inputStyle}
                placeholder='Name shown to customers'
              />
            </div>
            <div>
              <label style={labelStyle}>Support Email</label>
              <input
                type='email'
                value={orgSupportEmail}
                onChange={(e) => setOrgSupportEmail(e.target.value)}
                style={inputStyle}
                placeholder='support@yourshop.com'
              />
            </div>
            <div>
              <label style={labelStyle}>Support Phone</label>
              <input
                type='text'
                value={orgSupportPhone}
                onChange={(e) => setOrgSupportPhone(e.target.value)}
                style={inputStyle}
                placeholder='(555) 555-5555'
              />
            </div>
            {errorOrg && <div className='notice'>{errorOrg}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type='submit' className='button' disabled={savingOrg}>
                {savingOrg ? 'Saving...' : 'Save Business Info'}
              </button>
              {savedOrg && <span style={{ color: '#16a34a', fontWeight: 600 }}>Saved!</span>}
            </div>
          </form>
        </div>

        {/* Section 2 — Receiving Address */}
        <div className='policy-card'>
          <h2>Receiving Address &amp; Mail-In Instructions</h2>
          <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Address Line 1</label>
              <input
                type='text'
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                style={inputStyle}
                placeholder='123 Main St'
              />
            </div>
            <div>
              <label style={labelStyle}>Address Line 2</label>
              <input
                type='text'
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                style={inputStyle}
                placeholder='Suite 100 (optional)'
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', gap: 12 }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type='text'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                  placeholder='City'
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input
                  type='text'
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={inputStyle}
                  placeholder='CA'
                  maxLength={2}
                />
              </div>
              <div>
                <label style={labelStyle}>Postal Code</label>
                <input
                  type='text'
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  style={inputStyle}
                  placeholder='90210'
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
                Mail-in repairs enabled
              </label>
            </div>
            <div>
              <label style={labelStyle}>Packing Checklist (one item per line)</label>
              <textarea
                value={packingChecklist}
                onChange={(e) => setPackingChecklist(e.target.value)}
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                placeholder={'Remove SIM card\nBackup your data\nInclude your charger'}
              />
            </div>
            <div>
              <label style={labelStyle}>Shipping Notes (one item per line)</label>
              <textarea
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder={'Use a padded envelope\nShip via USPS Priority Mail'}
              />
            </div>
            {errorAddress && <div className='notice'>{errorAddress}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type='submit' className='button' disabled={savingAddress}>
                {savingAddress ? 'Saving...' : 'Save Address & Instructions'}
              </button>
              {savedAddress && <span style={{ color: '#16a34a', fontWeight: 600 }}>Saved!</span>}
            </div>
          </form>
        </div>

        {/* Section 3 — Branding */}
        <div className='policy-card'>
          <h2>Branding</h2>
          <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Logo URL</label>
              <input
                type='text'
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                style={inputStyle}
                placeholder='https://yourshop.com/logo.png'
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Primary Color</label>
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
                <label style={labelStyle}>Accent Color</label>
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
              <label style={labelStyle}>Hero Headline</label>
              <input
                type='text'
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                style={inputStyle}
                placeholder='Fast, reliable device repair'
              />
            </div>
            <div>
              <label style={labelStyle}>Hero Subheadline</label>
              <input
                type='text'
                value={heroSubheadline}
                onChange={(e) => setHeroSubheadline(e.target.value)}
                style={inputStyle}
                placeholder='Get a free estimate in minutes'
              />
            </div>
            {errorBranding && <div className='notice'>{errorBranding}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type='submit' className='button' disabled={savingBranding}>
                {savingBranding ? 'Saving...' : 'Save Branding'}
              </button>
              {savedBranding && <span style={{ color: '#16a34a', fontWeight: 600 }}>Saved!</span>}
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
