'use client'

import { useState, useRef, useCallback } from 'react'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { searchArticles, CATEGORY_MAP } from '../lib/helpContent'

export default function HelpSearch({ placeholder, autoFocus = false }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  const effectivePlaceholder = placeholder || t('helpCenter.searchPlaceholder')

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setResults(searchArticles(val))
    }, 180)
  }, [])

  const showDropdown = focused && query.trim().length >= 2

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 18, pointerEvents: 'none', color: 'var(--muted)',
        }}>🔍</span>
        <input
          ref={inputRef}
          type='search'
          className='input'
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={effectivePlaceholder}
          autoFocus={autoFocus}
          style={{ paddingLeft: 42, fontSize: '1rem', borderRadius: 'var(--radius-md)', width: '100%', boxSizing: 'border-box' }}
          aria-label={t('helpCenter.searchAria')}
        />
      </div>
      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 50, overflow: 'hidden',
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: 14 }}>
              {t('helpCenter.searchNoResults', { query })}
            </div>
          ) : results.map((article) => {
            const cat = CATEGORY_MAP[article.category]
            return (
              <LocalizedLink
                key={article.slug}
                href={`/help/${article.category}/${article.slug}`}
                style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid var(--line)' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{article.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {cat?.title} · {t('helpCenter.minRead', { minutes: article.readMinutes })}
                </div>
              </LocalizedLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
