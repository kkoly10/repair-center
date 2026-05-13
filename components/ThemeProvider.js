'use client'

/**
 * Injects org branding colors as CSS custom properties on :root.
 * Renders only a <style> tag — no wrapper element so layout is unaffected.
 */
export default function ThemeProvider({ primaryColor, accentColor }) {
  if (!primaryColor && !accentColor) return null

  const rules = []
  if (primaryColor) {
    rules.push(`--blue: ${primaryColor}`)
    rules.push(`--blue-strong: ${primaryColor}`)
  }
  if (accentColor) {
    rules.push(`--accent: ${accentColor}`)
  }

  return <style suppressHydrationWarning>{`:root { ${rules.join('; ')} }`}</style>
}
