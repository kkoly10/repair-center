'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { searchArticles, CATEGORY_MAP } from '../lib/helpContent'

export default function HelpSearch({ placeholder = 'Search help articles…', autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

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
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{ paddingLeft: 42, fontSize: '1rem', borderRadius: 'var(--radius-md)', width: '100%', boxSizing: 'border-box' }}
          aria-label='Search help articles'
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
              No articles found for &ldquo;{query}&rdquo;
            </div>
          ) : results.map((article) => {
            const cat = CATEGORY_MAP[article.category]
            return (
              <Link
                key={article.slug}
                href={`/help/${article.category}/${article.slug}`}
                style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid var(--line)' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{article.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {cat?.title} · {article.readMinutes} min read
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
