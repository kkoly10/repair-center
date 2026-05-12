import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
import { getSessionOrgId } from '../../../../../lib/admin/getSessionOrgId'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function requireAdminRole(orgId, supabase) {
  const cookieStore = await cookies()
  const authClient = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
  })
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return false

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  return ['owner', 'admin'].includes(membership?.role)
}

export async function PATCH(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    if (!await requireAdminRole(orgId, supabase)) {
      return NextResponse.json(
        { error: 'Forbidden: only owners and admins can change member roles.' },
        { status: 403 }
      )
    }

    const params = await context.params
    const memberId = params?.memberId

    if (!memberId) {
      return NextResponse.json({ error: 'Missing member ID.' }, { status: 400 })
    }

    const body = await request.json()
    const { role } = body

    if (!['admin', 'tech', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: admin, tech, viewer.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', orgId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update member role.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, context) {
  let orgId
  try {
    orgId = await getSessionOrgId()
  } catch (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    if (!await requireAdminRole(orgId, supabase)) {
      return NextResponse.json(
        { error: 'Forbidden: only owners and admins can remove members.' },
        { status: 403 }
      )
    }

    const params = await context.params
    const memberId = params?.memberId

    if (!memberId) {
      return NextResponse.json({ error: 'Missing member ID.' }, { status: 400 })
    }

    const { data: memberToRemove, error: fetchError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('id', memberId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    }

    if (memberToRemove.role === 'owner') {
      const { count, error: countError } = await supabase
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('role', 'owner')
        .neq('status', 'disabled')

      if (countError) throw countError
      if (count <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the organization.' },
          { status: 400 }
        )
      }
    }

    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', orgId)

    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to remove member.' },
      { status: 500 }
    )
  }
}
