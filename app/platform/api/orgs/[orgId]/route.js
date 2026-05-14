import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getPlatformSession } from '../../../../../lib/platform/getPlatformSession'

export const runtime = 'nodejs'

export async function GET(_req, context) {
  try {
    await getPlatformSession()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 403 })
  }

  const { orgId } = await context.params
  const supabase = getSupabaseAdmin()

  const [orgRes, subRes, membersRes, quotesCountRes, ordersCountRes, customersCountRes, recentQuotesRes] =
    await Promise.all([
      supabase.from('organizations')
        .select('id, name, slug, status, plan_key, trial_ends_at, created_at, stripe_customer_id, updated_at')
        .eq('id', orgId).single(),
      supabase.from('organization_subscriptions')
        .select('plan_key, status, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id')
        .eq('organization_id', orgId).maybeSingle(),
      supabase.from('organization_members').select('id, role, status, user_id').eq('organization_id', orgId),
      supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('repair_orders').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase
        .from('quote_requests')
        .select('id, quote_id, brand_name, model_name, repair_type_key, status, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  if (orgRes.error) {
    const is404 = orgRes.error.code === 'PGRST116'
    return NextResponse.json(
      { error: is404 ? 'Organization not found.' : orgRes.error.message },
      { status: is404 ? 404 : 500 }
    )
  }
  if (membersRes.error)
    return NextResponse.json({ error: membersRes.error.message }, { status: 500 })
  if (subRes.error)
    return NextResponse.json({ error: subRes.error.message }, { status: 500 })
  const countError = quotesCountRes.error || ordersCountRes.error || customersCountRes.error || recentQuotesRes.error
  if (countError)
    return NextResponse.json({ error: countError.message }, { status: 500 })

  const userIds = (membersRes.data || []).map((m) => m.user_id).filter(Boolean)
  const profilesRes = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] }

  const profilesById = {}
  for (const p of profilesRes.data || []) profilesById[p.id] = p

  const members = (membersRes.data || []).map((m) => ({
    ...m,
    profile: profilesById[m.user_id] || null,
  }))

  const trialDaysLeft = orgRes.data.trial_ends_at
    ? Math.ceil((new Date(orgRes.data.trial_ends_at).getTime() - Date.now()) / 86400000)
    : null

  return NextResponse.json({
    ok: true,
    org: orgRes.data,
    trialDaysLeft,
    subscription: subRes.data,
    members,
    usage: {
      quotes: quotesCountRes.count ?? 0,
      orders: ordersCountRes.count ?? 0,
      customers: customersCountRes.count ?? 0,
    },
    recentQuotes: recentQuotesRes.data || [],
  })
}

export async function PATCH(request, context) {
  try {
    await getPlatformSession()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 403 })
  }

  const { orgId } = await context.params
  const supabase = getSupabaseAdmin()

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, status, trial_ends_at')
    .eq('id', orgId)
    .single()

  if (orgErr) {
    const is404 = orgErr.code === 'PGRST116'
    return NextResponse.json(
      { error: is404 ? 'Organization not found.' : orgErr.message },
      { status: is404 ? 404 : 500 }
    )
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { action, days } = body

  if (action === 'suspend') {
    const { error } = await supabase.from('organizations').update({ status: 'suspended' }).eq('id', orgId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'suspended' })
  }

  if (action === 'reactivate') {
    const { data: sub } = await supabase
      .from('organization_subscriptions')
      .select('status')
      .eq('organization_id', orgId)
      .maybeSingle()
    const newStatus = sub && ['active', 'trialing'].includes(sub.status) ? 'active' : 'trialing'
    const { error } = await supabase.from('organizations').update({ status: newStatus }).eq('id', orgId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: newStatus })
  }

  if (action === 'extend_trial') {
    const extendDays = Math.min(Math.max(parseInt(days) || 7, 1), 90)
    const baseTime = org.trial_ends_at
      ? Math.max(new Date(org.trial_ends_at).getTime(), Date.now())
      : Date.now()
    const newEnd = new Date(baseTime + extendDays * 86400000).toISOString()
    const { error } = await supabase
      .from('organizations')
      .update({ trial_ends_at: newEnd, status: 'trialing' })
      .eq('id', orgId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, trial_ends_at: newEnd, status: 'trialing' })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
