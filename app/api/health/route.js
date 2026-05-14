import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

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

  const allOk = Object.values(checks).every((c) => c.ok)

  return NextResponse.json(
    { ok: allOk, checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  )
}
