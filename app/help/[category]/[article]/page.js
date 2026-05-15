import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ARTICLE_MAP, CATEGORY_MAP, getRelatedArticles } from '../../../../lib/helpContent'
import HelpArticleVote from '../../../../components/HelpArticleVote'

export async function generateMetadata({ params }) {
  const { article: articleSlug } = await params
  const article = ARTICLE_MAP[articleSlug]
  if (!article) return {}
  return {
    title: article.title,
    description: article.excerpt,
  }
}

// Lightweight Markdown-to-HTML renderer (no external library)
function renderMarkdown(md) {
  let html = md
    // Code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
      `<pre style="background:var(--surface-alt);border:1px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;overflow-x:auto;font-size:0.85rem;line-height:1.6;margin:16px 0"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
    )
    // Tables
    .replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/gm, (_, header, rows) => {
      const ths = header.split('|').filter(Boolean).map((h) => `<th style="padding:8px 12px;text-align:left;background:var(--surface-alt);font-size:13px;font-weight:700;border-bottom:2px solid var(--line)">${h.trim()}</th>`).join('')
      const trs = rows.trim().split('\n').map((row) => {
        const tds = row.split('|').filter(Boolean).map((d) => `<td style="padding:8px 12px;border-bottom:1px solid var(--line);font-size:13px">${d.trim()}</td>`).join('')
        return `<tr>${tds}</tr>`
      }).join('')
      return `<div style="overflow-x:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:var(--radius-sm)"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`
    })
    // H2
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.2rem;font-weight:700;margin:28px 0 10px">$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;margin:20px 0 8px">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface-alt);padding:2px 5px;border-radius:3px;font-size:0.875em">$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:4px">$1</li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul style="margin:10px 0 10px 20px;line-height:1.6">${m}</ul>`)
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--line);margin:24px 0">')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--blue);text-decoration:none">$1</a>')
    // Paragraphs — wrap lines that aren't block elements
    .replace(/^(?!<[h|u|p|l|d|p|c|t|h|b|i]|$)(.+)$/gm, '<p style="margin:0 0 14px;line-height:1.65">$1</p>')

  return html
}

export default async function HelpArticlePage({ params }) {
  const { category, article: articleSlug } = await params
  const article = ARTICLE_MAP[articleSlug]
  if (!article || article.category !== category) notFound()

  const cat = CATEGORY_MAP[category]
  const related = getRelatedArticles(articleSlug)
  const html = renderMarkdown(article.content.trim())

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 64px' }}>

      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href='/help' style={{ color: 'var(--blue)', textDecoration: 'none' }}>Help Center</Link>
        <span>›</span>
        <Link href={`/help/${category}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{cat?.title}</Link>
        <span>›</span>
        <span>{article.title}</span>
      </nav>

      {/* Article header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.25 }}>
          {article.title}
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--muted)', fontSize: 13 }}>
          <span>{article.readMinutes} min read</span>
          <span>·</span>
          <span style={{
            background: cat?.color || 'var(--surface-alt)',
            color: cat?.colorFg || 'var(--muted)',
            padding: '2px 8px',
            borderRadius: 99,
            fontWeight: 600,
            fontSize: 11,
          }}>{cat?.title}</span>
        </div>
      </div>

      {/* Article content */}
      <div
        style={{ lineHeight: 1.65, color: 'var(--text)', fontSize: '0.95rem' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Helpful vote */}
      <HelpArticleVote articleSlug={articleSlug} />

      {/* Related articles */}
      {related.length > 0 && (
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Related articles
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/help/${rel.category}/${rel.slug}`}
                style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>→</span>
                <span>{rel.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', gap: 16 }}>
        <Link href={`/help/${category}`} style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>← {cat?.title}</Link>
        <Link href='/help' style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Help Center home</Link>
      </div>
    </div>
  )
}
