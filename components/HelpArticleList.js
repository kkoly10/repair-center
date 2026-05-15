'use client'

import { useState } from 'react'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

function ArticleCard({ article, category, t }) {
  const [hovered, setHovered] = useState(false)

  return (
    <LocalizedLink href={`/help/${category}/${article.slug}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--surface)',
          border: `1px solid ${hovered ? 'var(--blue)' : 'var(--line)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>{article.title}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{article.excerpt}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t('helpCenter.minRead', { minutes: article.readMinutes })}</span>
          <span style={{ color: 'var(--blue)', fontSize: 16 }}>→</span>
        </div>
      </div>
    </LocalizedLink>
  )
}

export default function HelpArticleList({ articles, category }) {
  const t = useT()
  if (!articles.length) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>{t('helpCenter.noArticlesYet')}</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} category={category} t={t} />
      ))}
    </div>
  )
}
