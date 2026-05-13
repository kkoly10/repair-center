import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { sendAppointmentConfirmationEmail } from '../../../lib/email'

export const runtime = 'nodejs'

export async function POST(request) {
  const supabase = getSupabaseAdmin()

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { orgSlug, firstName, lastName, email, phone, brandName, modelName, repairDescription, preferredAt } = body || {}

  if (!orgSlug) return NextResponse.json({ error: 'orgSlug is required.' }, { status: 400 })
  if (!firstName) return NextResponse.json({ error: 'First name is required.' }, { status: 400 })
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  if (!preferredAt) return NextResponse.json({ error: 'Preferred appointment time is required.' }, { status: 400 })

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
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

  // Validate preferred time is in the future
  const preferredDate = new Date(preferredAt)
  if (isNaN(preferredDate.getTime())) {
    return NextResponse.json({ error: 'Invalid appointment date.' }, { status: 400 })
  }
  if (preferredDate < new Date()) {
    return NextResponse.json({ error: 'Appointment time must be in the future.' }, { status: 400 })
  }

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
    })
    .select('id, preferred_at, status')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Fire-and-forget confirmation email
  ;(async () => {
    try {
      await sendAppointmentConfirmationEmail({
        to: email,
        orgName: org.name,
        firstName,
        preferredAt: preferredDate,
        device: [brandName, modelName].filter(Boolean).join(' ') || null,
        repairDescription: repairDescription || null,
      })
    } catch (err) {
      console.error('[appointments] confirmation email failed:', err)
    }
  })()

  return NextResponse.json({ ok: true, appointment }, { status: 201 })
}
