'use client'

import { useState } from 'react'
import { useT } from '../lib/i18n/TranslationProvider'

export default function HelpArticleVote({ articleSlug }) {
  const t = useT()
  const [voted, setVoted] = useState(null) // 'yes' | 'no' | null

  if (voted) {
    return (
      <div style={{
        marginTop: 40, padding: '16px 20px',
        background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)',
        textAlign: 'center', fontSize: 14, color: 'var(--muted)',
      }}>
        {voted === 'yes' ? t('helpCenter.voteThanksYes') : t('helpCenter.voteThanksNo')}
      </div>
    )
  }

  return (
    <div style={{
      marginTop: 40, padding: '16px 20px',
      background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t('helpCenter.voteHelpful')}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setVoted('yes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            border: '1px solid var(--line)', background: 'var(--surface)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
          }}
          aria-label={t('helpCenter.voteYesAria')}
        >
          {t('helpCenter.voteYes')}
        </button>
        <button
          onClick={() => setVoted('no')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            border: '1px solid var(--line)', background: 'var(--surface)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
          }}
          aria-label={t('helpCenter.voteNoAria')}
        >
          {t('helpCenter.voteNo')}
        </button>
      </div>
    </div>
  )
}
