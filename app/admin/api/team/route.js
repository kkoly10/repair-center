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
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('id, user_id, role, status, invited_email, created_at')
      .eq('organization_id', orgId)
      .neq('status', 'disabled')
      .order('created_at', { ascending: true })

    if (membersError) throw membersError

    const membersWithProfiles = await Promise.all(
      (members || []).map(async (member) => {
        if (!member.user_id) return { ...member, full_name: null }
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', member.user_id)
          .maybeSingle()
        return { ...member, full_name: profile?.full_name ?? null }
      })
    )

    const { data: invitations, error: invitationsError } = await supabase
      .from('organization_invitations')
      .select('id, invited_email, role, expires_at, created_at')
      .eq('organization_id', orgId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (invitationsError) throw invitationsError

    return NextResponse.json({
      ok: true,
      members: membersWithProfiles,
      invitations: invitations || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load team.' },
      { status: 500 }
    )
  }
}
