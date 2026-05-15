import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

export const runtime = 'nodejs'

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_BILLING_PRICE_ID',
  'STRIPE_BILLING_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'NEXT_PUBLIC_BASE_URL',
]

// Optional vars used only by the backup-recency check. Without these, the
// backup check is reported as `skipped` (does not fail overall health).
//   SUPABASE_ACCESS_TOKEN — Personal Access Token with project read scope
//   SUPABASE_PROJECT_ID   — e.g. "bpchjjgilooaztqipdkt"
// Backup is considered fresh if the most recent backup is < 30h old (allows
// one daily backup window + 6h slack).
const BACKUP_MAX_AGE_MS = 30 * 60 * 60 * 1000

const OPTIONAL_VARS = [
  'CRON_SECRET',
  'EMAIL_LINK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
]

export async function GET() {
  const checks = {}

  // Env var check
  const missingRequired = REQUIRED_VARS.filter((v) => !process.env[v])
  const missingOptional = OPTIONAL_VARS.filter((v) => !process.env[v])
  checks.env = {
    ok: missingRequired.length === 0,
    missingRequired,
    missingOptional,
  }

  // DB connectivity check
  try {
    const { error } = await getSupabaseAdmin()
      .from('organizations')
      .select('id')
      .limit(1)
    checks.db = { ok: !error, error: error?.message || null }
  } catch (err) {
    checks.db = { ok: false, error: err.message }
  }

  // Backup-recency check (best-effort). Requires Supabase Management API token.
  // When the env vars aren't set, marks as `skipped` and does not fail health.
  checks.backups = await checkBackupRecency()

  const allOk = Object.values(checks).every((c) => c.ok || c.skipped)

  return NextResponse.json(
    { ok: allOk, checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  )
}

async function checkBackupRecency() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const projectId = process.env.SUPABASE_PROJECT_ID

  if (!token || !projectId) {
    return { ok: true, skipped: true, reason: 'SUPABASE_ACCESS_TOKEN/PROJECT_ID not set' }
  }

  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/database/backups`,
      {
        headers: { Authorization: `Bearer ${token}` },
        // Don't hang health check if Management API is slow
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) {
      return { ok: false, error: `Supabase API ${res.status}` }
    }
    const body = await res.json()
    const list = Array.isArray(body?.backups) ? body.backups : []
    if (list.length === 0) {
      return { ok: false, error: 'no backups returned by Supabase Management API' }
    }
    // Backups carry an `inserted_at` (or `created_at` on some plans) ISO timestamp
    const latest = list
      .map((b) => b.inserted_at || b.created_at)
      .filter(Boolean)
      .sort()
      .pop()
    if (!latest) {
      return { ok: false, error: 'backup list missing timestamps' }
    }
    const age = Date.now() - new Date(latest).getTime()
    return {
      ok: age < BACKUP_MAX_AGE_MS,
      latest,
      ageMs: age,
      error: age < BACKUP_MAX_AGE_MS ? null : `latest backup is ${Math.round(age / 3600000)}h old`,
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
