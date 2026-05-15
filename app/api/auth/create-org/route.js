import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { isReservedSlug } from '../../../../lib/reservedSlugs'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request) {
  const supabase = getSupabaseAdmin()

  try {
    const cookieStore = await cookies()
    const authClient = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    })

    const { data: { user }, error: userError } = await authClient.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (membershipCheckError) throw membershipCheckError
    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already belongs to an organization.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
    const publicName = typeof body.public_name === 'string' ? body.public_name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required.' }, { status: 400 })
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug may only contain lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      )
    }

    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { error: 'Slug must be between 3 and 50 characters.' },
        { status: 400 }
      )
    }

    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { error: 'This slug is reserved. Please choose a different one.' },
        { status: 400 }
      )
    }

    const { data: existingSlug, error: slugCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (slugCheckError) throw slugCheckError
    if (existingSlug) {
      return NextResponse.json(
        { error: 'This slug is already taken. Please choose a different one.' },
        { status: 400 }
      )
    }

    const trialEndsAt = new Date(Date.now() + 14 * 86400000).toISOString()

    const { data: newOrg, error: orgInsertError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        public_name: publicName || name,
        status: 'trialing',
        plan_key: 'pro',
        trial_ends_at: trialEndsAt,
        created_by_user_id: userId,
      })
      .select('id, slug')
      .single()

    if (orgInsertError) throw orgInsertError

    const orgId = newOrg.id

    const [membersResult, settingsResult, brandingResult, paymentSettingsResult] =
      await Promise.all([
        supabase.from('organization_members').insert({
          organization_id: orgId,
          user_id: userId,
          role: 'owner',
          status: 'active',
        }),
        supabase.from('organization_settings').insert({
          organization_id: orgId,
        }),
        supabase.from('organization_branding').insert({
          organization_id: orgId,
        }),
        supabase.from('organization_payment_settings').insert({
          organization_id: orgId,
          payment_mode: 'manual',
        }),
      ])

    if (membersResult.error) throw membersResult.error
    if (settingsResult.error) throw settingsResult.error
    if (brandingResult.error) throw brandingResult.error
    if (paymentSettingsResult.error) throw paymentSettingsResult.error

    // Clone pricing rules from the oldest org (template/default)
    const { data: templateOrg } = await supabase
      .from('organizations')
      .select('id')
      .neq('id', orgId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (templateOrg) {
      const { data: templateRules } = await supabase
        .from('pricing_rules')
        .select('model_id, repair_type_id, price_mode, public_price_fixed, public_price_min, public_price_max, deposit_amount, return_shipping_fee, warranty_days, active')
        .eq('organization_id', templateOrg.id)

      if (templateRules && templateRules.length > 0) {
        const clonedRules = templateRules.map((rule) => ({ ...rule, organization_id: orgId }))
        // Ignore errors — new org without pricing is better than a failed signup
        await supabase.from('pricing_rules').insert(clonedRules)
      }
    }

    return NextResponse.json({
      ok: true,
      organizationId: orgId,
      slug: newOrg.slug,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create organization.' },
      { status: 500 }
    )
  }
}
