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

  const [orgsRes, subsRes, membersRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug, status, plan_key, trial_ends_at, created_at, stripe_customer_id')
      .order('created_at', { ascending: false }),
    supabase
      .from('organization_subscriptions')
      .select('organization_id, plan_key, status, current_period_end, cancel_at_period_end'),
    supabase
      .from('organization_members')
      .select('organization_id')
      .eq('status', 'active'),
  ])

  if (orgsRes.error) return NextResponse.json({ error: orgsRes.error.message }, { status: 500 })

  const subsByOrg = {}
  for (const s of subsRes.data || []) subsByOrg[s.organization_id] = s

  const memberCounts = {}
  for (const m of membersRes.data || []) {
    memberCounts[m.organization_id] = (memberCounts[m.organization_id] || 0) + 1
  }

  const orgs = (orgsRes.data || []).map((org) => ({
    ...org,
    subscription: subsByOrg[org.id] || null,
    memberCount: memberCounts[org.id] || 0,
  }))

  return NextResponse.json({ ok: true, orgs })
}
