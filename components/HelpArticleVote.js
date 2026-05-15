'use client'

import { useState } from 'react'

export default function HelpArticleVote({ articleSlug }) {
  const [voted, setVoted] = useState(null) // 'yes' | 'no' | null

  if (voted) {
    return (
      <div style={{
        marginTop: 40, padding: '16px 20px',
        background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)',
        textAlign: 'center', fontSize: 14, color: 'var(--muted)',
      }}>
        {voted === 'yes' ? '👍 Thanks! Glad this was helpful.' : '👎 Thanks for the feedback. We\'ll work on improving this article.'}
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
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Was this article helpful?</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setVoted('yes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            border: '1px solid var(--line)', background: 'var(--surface)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
          }}
          aria-label='Yes, this article was helpful'
        >
          👍 Yes
        </button>
        <button
          onClick={() => setVoted('no')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            border: '1px solid var(--line)', background: 'var(--surface)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
          }}
          aria-label='No, this article was not helpful'
        >
          👎 No
        </button>
      </div>
    </div>
  )
}
