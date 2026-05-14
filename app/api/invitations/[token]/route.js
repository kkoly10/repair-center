import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function validateInvitation(token) {
  const supabase = getSupabaseAdmin()

  const { data: invitation, error } = await supabase
    .from('organization_invitations')
    .select('id, invited_email, role, expires_at, accepted_at, organization_id')
    .eq('token', token)
    .maybeSingle()

  if (error) throw error

  if (!invitation) return { valid: false, reason: 'not_found' }
  if (invitation.accepted_at !== null) return { valid: false, reason: 'already_accepted' }
  if (new Date(invitation.expires_at) < new Date()) return { valid: false, reason: 'expired' }

  return { valid: true, invitation }
}

export async function GET(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const token = params?.token

    if (!token) {
      return NextResponse.json({ valid: false, reason: 'not_found' })
    }

    const result = await validateInvitation(token)
    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason })
    }

    const { invitation } = result

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, public_name')
      .eq('id', invitation.organization_id)
      .maybeSingle()

    if (orgError) throw orgError

    return NextResponse.json({
      valid: true,
      email: invitation.invited_email,
      role: invitation.role,
      orgName: org?.public_name || org?.name || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to look up invitation.' },
      { status: 500 }
    )
  }
}

export async function POST(request, context) {
  const supabase = getSupabaseAdmin()

  try {
    const params = await context.params
    const token = params?.token

    if (!token) {
      return NextResponse.json({ error: 'Missing token.' }, { status: 400 })
    }

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
    const userEmail = user.email?.toLowerCase()

    const result = await validateInvitation(token)
    if (!result.valid) {
      return NextResponse.json(
        { error: `Invitation is ${result.reason}.` },
        { status: 400 }
      )
    }

    const { invitation } = result
    const organizationId = invitation.organization_id

    if (userEmail !== invitation.invited_email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address.' },
        { status: 403 }
      )
    }

    const { data: existingMember, error: memberCheckError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (memberCheckError) throw memberCheckError
    if (existingMember) {
      await supabase
        .from('organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)
      return NextResponse.json({ ok: true, alreadyMember: true })
    }

    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: invitation.role,
        status: 'active',
        invited_email: invitation.invited_email,
      })

    if (insertError) throw insertError

    const { error: acceptError } = await supabase
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (acceptError) throw acceptError

    return NextResponse.json({
      ok: true,
      organizationId,
      role: invitation.role,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to accept invitation.' },
      { status: 500 }
    )
  }
}
