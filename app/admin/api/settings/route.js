import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

export async function GET() {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const [orgResult, settingsResult, brandingResult, paymentResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('id, name, slug, public_name, support_email, support_phone')
        .eq('id', orgId)
        .maybeSingle(),
      supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle(),
      supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle(),
      supabase
        .from('organization_payment_settings')
        .select('payment_mode, manual_payment_instructions, cashapp_tag, zelle_contact, square_payment_url, stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_charges_enabled, stripe_connect_payouts_enabled')
        .eq('organization_id', orgId)
        .maybeSingle(),
    ])

    if (orgResult.error) throw orgResult.error
    if (settingsResult.error) throw settingsResult.error
    if (brandingResult.error) throw brandingResult.error
    if (paymentResult.error) throw paymentResult.error

    return NextResponse.json({
      ok: true,
      org: orgResult.data,
      settings: settingsResult.data,
      branding: brandingResult.data,
      payment: paymentResult.data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load settings.' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { org = {}, settings = {}, branding = {}, payment = {} } = body

    const hasOrg = Object.keys(org).length > 0
    const hasSettings = Object.keys(settings).length > 0
    const hasBranding = Object.keys(branding).length > 0
    const hasPayment = Object.keys(payment).length > 0

    if (hasOrg && (!org.name || typeof org.name !== 'string' || org.name.trim() === '')) {
      return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })
    }

    if (hasPayment && payment.payment_mode &&
        !['manual', 'platform_stripe', 'stripe_connect'].includes(payment.payment_mode)) {
      return NextResponse.json({ error: 'Invalid payment mode.' }, { status: 400 })
    }

    const promises = []

    if (hasOrg) {
      promises.push(
        supabase
          .from('organizations')
          .update({
            name: org.name.trim(),
            ...(org.public_name !== undefined && { public_name: org.public_name }),
            ...(org.support_email !== undefined && { support_email: org.support_email }),
            ...(org.support_phone !== undefined && { support_phone: org.support_phone }),
          })
          .eq('id', orgId)
      )
    }

    if (hasSettings) {
      promises.push(
        supabase
          .from('organization_settings')
          .upsert({
            organization_id: orgId,
            ...(settings.receiving_line1 !== undefined && { receiving_line1: settings.receiving_line1 }),
            ...(settings.receiving_line2 !== undefined && { receiving_line2: settings.receiving_line2 }),
            ...(settings.receiving_city !== undefined && { receiving_city: settings.receiving_city }),
            ...(settings.receiving_state !== undefined && { receiving_state: settings.receiving_state }),
            ...(settings.receiving_postal_code !== undefined && { receiving_postal_code: settings.receiving_postal_code }),
            ...(settings.packing_checklist !== undefined && { packing_checklist: settings.packing_checklist }),
            ...(settings.shipping_notes !== undefined && { shipping_notes: settings.shipping_notes }),
            ...(settings.mail_in_enabled !== undefined && { mail_in_enabled: Boolean(settings.mail_in_enabled) }),
          }, { onConflict: 'organization_id' })
      )
    }

    if (hasBranding) {
      promises.push(
        supabase
          .from('organization_branding')
          .upsert({
            organization_id: orgId,
            ...(branding.logo_url !== undefined && { logo_url: branding.logo_url }),
            ...(branding.primary_color !== undefined && { primary_color: branding.primary_color }),
            ...(branding.accent_color !== undefined && { accent_color: branding.accent_color }),
            ...(branding.hero_headline !== undefined && { hero_headline: branding.hero_headline }),
            ...(branding.hero_subheadline !== undefined && { hero_subheadline: branding.hero_subheadline }),
          }, { onConflict: 'organization_id' })
      )
    }

    if (hasPayment) {
      promises.push(
        supabase
          .from('organization_payment_settings')
          .upsert({
            organization_id: orgId,
            ...(payment.payment_mode !== undefined && { payment_mode: payment.payment_mode }),
            ...(payment.manual_payment_instructions !== undefined && { manual_payment_instructions: payment.manual_payment_instructions }),
            ...(payment.cashapp_tag !== undefined && { cashapp_tag: payment.cashapp_tag }),
            ...(payment.zelle_contact !== undefined && { zelle_contact: payment.zelle_contact }),
            ...(payment.square_payment_url !== undefined && { square_payment_url: payment.square_payment_url }),
            ...(payment.stripe_connect_account_id !== undefined && { stripe_connect_account_id: payment.stripe_connect_account_id }),
            ...(payment.stripe_connect_onboarding_complete !== undefined && { stripe_connect_onboarding_complete: payment.stripe_connect_onboarding_complete }),
            ...(payment.stripe_connect_charges_enabled !== undefined && { stripe_connect_charges_enabled: payment.stripe_connect_charges_enabled }),
            ...(payment.stripe_connect_payouts_enabled !== undefined && { stripe_connect_payouts_enabled: payment.stripe_connect_payouts_enabled }),
          }, { onConflict: 'organization_id' })
      )
    }

    if (!promises.length) {
      return NextResponse.json({ ok: true })
    }

    const results = await Promise.all(promises)
    for (const result of results) {
      if (result.error) throw result.error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save settings.' },
      { status: 500 }
    )
  }
}
