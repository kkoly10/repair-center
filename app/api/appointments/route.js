import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { sendAppointmentConfirmationEmail } from '../../../lib/email'
import { checkRateLimit } from '../../../lib/rateLimiter'
import { getLocale } from '../../../lib/i18n/server'

export const runtime = 'nodejs'

export async function POST(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const { allowed } = await checkRateLimit(ip, { maxRequests: 10, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a while before trying again.' },
      { status: 429 }
    )
  }

  const supabase = getSupabaseAdmin()

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const raw = body || {}
  const orgSlug = (raw.orgSlug || '').toString().trim()
  const firstName = (raw.firstName || '').toString().trim()
  const lastName = (raw.lastName || '').toString().trim()
  const email = (raw.email || '').toString().trim().toLowerCase()
  const phone = (raw.phone || '').toString().trim()
  const brandName = (raw.brandName || '').toString().trim()
  const modelName = (raw.modelName || '').toString().trim()
  const repairDescription = (raw.repairDescription || '').toString().trim()
  const preferredAt = (raw.preferredAt || '').toString().trim()

  if (!orgSlug) return NextResponse.json({ error: 'orgSlug is required.' }, { status: 400 })
  if (!firstName) return NextResponse.json({ error: 'First name is required.' }, { status: 400 })
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  if (!preferredAt) return NextResponse.json({ error: 'Preferred appointment time is required.' }, { status: 400 })

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  // Validate preferred time is in the future
  const preferredDate = new Date(preferredAt)
  if (isNaN(preferredDate.getTime())) {
    return NextResponse.json({ error: 'Invalid appointment date.' }, { status: 400 })
  }
  if (preferredDate < new Date()) {
    return NextResponse.json({ error: 'Appointment time must be in the future.' }, { status: 400 })
  }

  // Resolve org by slug
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, status')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })
  if (!org) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })

  // Look up a matching customer account in this org to auto-link customer_id
  const { data: matchedCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('organization_id', org.id)
    .eq('email', email)
    .maybeSingle()

  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      organization_id: org.id,
      first_name: firstName,
      last_name: lastName || null,
      email,
      phone: phone || null,
      brand_name: brandName || null,
      model_name: modelName || null,
      repair_description: repairDescription ? String(repairDescription).slice(0, 1000) : null,
      preferred_at: preferredDate.toISOString(),
      status: 'pending',
      customer_id: matchedCustomer?.id || null,
    })
    .select('id, preferred_at, status')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Fire-and-forget confirmation email
  ;(async () => {
    try {
      const locale = await getLocale()
      await sendAppointmentConfirmationEmail({
        to: email,
        orgName: org.name,
        firstName,
        preferredAt: preferredDate,
        device: [brandName, modelName].filter(Boolean).join(' ') || null,
        repairDescription: repairDescription || null,
        locale,
      })
    } catch (err) {
      console.error('[appointments] confirmation email failed:', err)
    }
  })()

  return NextResponse.json({ ok: true, appointment }, { status: 201 })
}
