import { NextResponse } from 'next/server'
import { reportError } from '../../../lib/observability'

export const runtime = 'edge'

// Receives Content-Security-Policy violation reports.
// Browsers send the legacy `application/csp-report` envelope from report-uri;
// newer Reporting API endpoints send `application/reports+json` arrays.
// We extract the salient fields and forward to Sentry (no-op if not configured).
//
// Returns 204 quickly to avoid amplification attacks and to keep the request
// out of the Vercel logs (Sentry is the persistent record).
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    const raw = await request.text()
    if (!raw) return new NextResponse(null, { status: 204 })

    let reports = []
    if (contentType.includes('application/reports+json')) {
      // Reporting API: array of envelopes
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) reports = parsed
    } else {
      // Legacy CSP report-uri: { "csp-report": { ... } }
      const parsed = JSON.parse(raw)
      reports = [parsed]
    }

    for (const r of reports) {
      const body = r?.body || r?.['csp-report'] || r
      const directive = body?.['violated-directive'] || body?.effectiveDirective || 'unknown'
      const blockedUri = body?.['blocked-uri'] || body?.blockedURL || body?.blockedURI || 'unknown'
      const docUri = body?.['document-uri'] || body?.documentURL || ''
      const sample = body?.['script-sample'] || body?.sample || ''

      // Log as Sentry message (not exception — these are user-agent reports,
      // not server errors). reportError handles the no-DSN-configured case.
      const err = new Error(`CSP: ${directive} blocked ${blockedUri}`)
      reportError(err, {
        area: 'csp-report',
        directive,
        blockedUri,
        docUri,
        sample: typeof sample === 'string' ? sample.slice(0, 200) : '',
      })
    }
  } catch {
    // Malformed report — discard quietly, don't 500 (would spam logs)
  }

  return new NextResponse(null, { status: 204 })
}
