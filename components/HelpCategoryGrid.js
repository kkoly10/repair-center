'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getArticlesByCategory } from '../lib/helpContent'

function CategoryCard({ cat }) {
  const [hovered, setHovered] = useState(false)
  const articles = getArticlesByCategory(cat.slug)

  return (
    <Link href={`/help/${cat.slug}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: cat.color,
          borderRadius: 'var(--radius-md)',
          padding: '20px 18px',
          height: '100%',
          boxSizing: 'border-box',
          transform: hovered ? 'translateY(-2px)' : 'none',
          boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: cat.colorFg, marginBottom: 6 }}>{cat.title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.45 }}>{cat.description}</div>
        <div style={{ fontSize: 12, color: cat.colorFg, fontWeight: 600 }}>{articles.length} articles →</div>
      </div>
    </Link>
  )
}

export default function HelpCategoryGrid({ categories }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {categories.map((cat) => <CategoryCard key={cat.slug} cat={cat} />)}
    </div>
  )
}
