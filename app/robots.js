export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://repaircenter.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/shop/', '/terms', '/privacy', '/platform-terms', '/for-shops'],
        disallow: ['/admin/', '/api/', '/invite/', '/signup'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
