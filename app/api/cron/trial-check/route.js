import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { sendTrialExpiryWarningEmail } from '../../../../lib/email'

export const runtime = 'nodejs'

// Called daily by Vercel Cron (configure in vercel.json) or an external scheduler.
// Authorization: Bearer $CRON_SECRET — set CRON_SECRET env var and configure in scheduler.

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const appUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

  // Fetch all trialing orgs that have a trial_ends_at set
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug, status, trial_ends_at, trial_warning_sent_at, stripe_customer_id')
    .eq('status', 'trialing')
    .not('trial_ends_at', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const expired = []
  const warned = []
  const errors = []

  for (const org of orgs || []) {
    const trialEnd = new Date(org.trial_ends_at)
    const msRemaining = trialEnd - now
    const daysRemaining = Math.ceil(msRemaining / 86400000)

    // ── Expire overdue trials ──────────────────────────────────────────────
    if (msRemaining < 0) {
      const { error: expireError } = await supabase
        .from('organizations')
        .update({ status: 'suspended' })
        .eq('id', org.id)
        .eq('status', 'trialing') // idempotent guard

      if (expireError) {
        errors.push({ orgId: org.id, action: 'expire', error: expireError.message })
      } else {
        expired.push(org.id)
        // Send expiry email if not yet sent (trial_warning_sent_at < trial_ends_at check is implicit)
        const ownerEmail = await getOwnerEmail(supabase, org.id)
        if (ownerEmail) {
          await sendTrialExpiryWarningEmail({
            to: ownerEmail,
            orgName: org.name,
            daysLeft: 0,
            billingUrl: `${appUrl}/admin/billing`,
          }).catch((err) => errors.push({ orgId: org.id, action: 'email_expired', error: err.message }))
        }
      }
      continue
    }

    // ── Send warning email (3-day and 1-day thresholds) ────────────────────
    const shouldWarn = daysRemaining <= 3
    if (!shouldWarn) continue

    // Don't spam — skip if we already sent a warning after the last threshold crossed
    const lastWarning = org.trial_warning_sent_at ? new Date(org.trial_warning_sent_at) : null
    const hoursSinceWarning = lastWarning ? (now - lastWarning) / 3600000 : Infinity
    if (hoursSinceWarning < 20) continue // sent within last 20h

    const ownerEmail = await getOwnerEmail(supabase, org.id)
    if (!ownerEmail) continue

    try {
      await sendTrialExpiryWarningEmail({
        to: ownerEmail,
        orgName: org.name,
        daysLeft: daysRemaining,
        billingUrl: `${appUrl}/admin/billing`,
      })

      await supabase
        .from('organizations')
        .update({ trial_warning_sent_at: now.toISOString() })
        .eq('id', org.id)

      warned.push({ orgId: org.id, daysRemaining })
    } catch (emailErr) {
      errors.push({ orgId: org.id, action: 'email_warn', error: emailErr.message })
    }
  }

  return NextResponse.json({
    ok: true,
    processed: (orgs || []).length,
    expired: expired.length,
    warned: warned.length,
    errors,
  })
}

async function getOwnerEmail(supabase, orgId) {
  const { data } = await supabase
    .from('organization_members')
    .select('profiles(email)')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  return data?.profiles?.email || null
}
