import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getCallerUserId() {
  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
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
    const userId = await getCallerUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerMembership, error: callerError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (callerError) throw callerError
    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json(
        { error: 'Forbidden: only owners and admins can invite team members.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const role = body.role === 'admin' ? 'admin' : 'tech'

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('organization_id', orgId)
      .eq('invited_email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (inviteCheckError) throw inviteCheckError
    if (existingInvite) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email.' },
        { status: 400 }
      )
    }

    const { data: invitation, error: insertError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: orgId,
        invited_email: email,
        role,
        invited_by_user_id: userId,
      })
      .select('token, invited_email, role')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      ok: true,
      token: invitation.token,
      email: invitation.invited_email,
      role: invitation.role,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send invitation.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const userId = await getCallerUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json(
        { error: 'Forbidden: only owners and admins can cancel invitations.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { invitationId } = body

    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId is required.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('organization_id', orgId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete invitation.' },
      { status: 500 }
    )
  }
}
