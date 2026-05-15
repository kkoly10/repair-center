'use client'

import { useState } from 'react'
import { useT } from '../lib/i18n/TranslationProvider'
import FeedbackPanel from './FeedbackPanel'

export default function FeedbackButton({ orgId, prefillEmail }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '8px 12px',
          background: 'none', border: 'none',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '0.85rem',
          textAlign: 'left',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
        title={t('customerPortal.feedbackTitle')}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        <span>{t('customerPortal.feedbackButton')}</span>
      </button>

      {open && (
        <FeedbackPanel
          orgId={orgId}
          prefillEmail={prefillEmail}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
