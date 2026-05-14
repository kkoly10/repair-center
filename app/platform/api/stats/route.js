import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getPlatformSession } from '../../../../lib/platform/getPlatformSession'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await getPlatformSession()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 403 })
  }

  const supabase = getSupabaseAdmin()

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug, status, created_at, trial_ends_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString()

  const counts = { active: 0, trialing: 0, past_due: 0, suspended: 0, cancelled: 0 }
  const trialUrgent = []
  let recentCount = 0

  for (const org of orgs) {
    counts[org.status] = (counts[org.status] || 0) + 1
    if (org.created_at >= thirtyDaysAgo) recentCount++
    if (org.status === 'trialing' && org.trial_ends_at) {
      const daysLeft = Math.ceil((new Date(org.trial_ends_at).getTime() - now) / 86400000)
      if (daysLeft <= 3) trialUrgent.push({ id: org.id, name: org.name, slug: org.slug, daysLeft })
    }
  }

  return NextResponse.json({
    ok: true,
    total: orgs.length,
    counts,
    recentCount,
    trialUrgent,
    recentOrgs: orgs.slice(0, 10),
  })
}
