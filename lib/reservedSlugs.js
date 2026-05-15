// Slugs that conflict with platform routes, common subdomains, or impersonation
// risks. Anything that could be confused with platform staff or that maps to an
// actual route in /app/.
const RESERVED = new Set([
  // Platform routes
  'admin', 'api', 'platform', 'auth', 'app', 'dashboard',
  // Customer-facing routes already in /app
  'shop', 'estimate', 'estimate-review', 'mail-in', 'track', 'pay',
  'review', 'invite', 'signup', 'login', 'logout', 'help', 'faq',
  'contact', 'devices', 'repairs', 'returns', 'privacy', 'terms',
  'platform-terms', 'shop-responsibility', 'data-privacy', 'feedback',
  'instant-estimate', 'how-it-works', 'for-shops', 'my-repairs',
  // Common subdomain / system names
  'www', 'mail', 'email', 'smtp', 'ftp', 'cdn', 'static', 'assets',
  'media', 'files', 'images', 'docs', 'documentation', 'blog', 'news',
  'support', 'status', 'health', 'monitor', 'metrics', 'webhook',
  'webhooks', 'callback', 'oauth', 'sso', 'saml',
  // Generic / brand-impersonation risks
  'repair-center', 'repaircenter', 'official', 'team', 'staff',
  'security', 'legal', 'billing', 'account', 'settings', 'profile',
  'notifications', 'developer', 'developers', 'partner', 'partners',
  'enterprise', 'business', 'about', 'careers', 'jobs', 'press',
  'investors', 'media-kit', 'brand', 'community', 'forum',
  // Reserved short codes
  'me', 'us', 'go', 'app', 'dev', 'qa', 'test', 'staging', 'prod',
  // Next.js / framework internals (defense in depth — slug regex would already
  // reject leading underscore but this keeps the list explicit)
  '_next', '_vercel', '_static', '_assets', '_app', '_document', '_error',
])

export function isReservedSlug(slug) {
  if (!slug || typeof slug !== 'string') return false
  return RESERVED.has(slug.toLowerCase().trim())
}

export function getReservedSlugs() {
  return [...RESERVED]
}
