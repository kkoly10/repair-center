import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { checkRateLimit } from '../../../lib/rateLimiter'
import { sendFeedbackEmail } from '../../../lib/email'

export const runtime = 'nodejs'

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateCheck = await checkRateLimit(ip, { maxRequests: 5, windowMs: 60 * 60 * 1000 })
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { type, message, email, pageUrl, organizationId } = body

  const VALID_TYPES = ['bug', 'feature', 'general']
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type must be one of: bug, feature, general.' }, { status: 400 })
  }

  const trimmedMessage = message?.trim() || ''
  if (trimmedMessage.length < 5) {
    return NextResponse.json({ error: 'Message must be at least 5 characters.' }, { status: 400 })
  }
  if (trimmedMessage.length > 1000) {
    return NextResponse.json({ error: 'Message must be 1000 characters or fewer.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { error: insertErr } = await supabase
    .from('feedback')
    .insert({
      type,
      message: trimmedMessage,
      email: email?.trim().toLowerCase() || null,
      page_url: pageUrl || null,
      organization_id: organizationId || null,
    })

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 500 })
  }

  // Fire-and-forget email to feedback inbox if configured
  if (process.env.FEEDBACK_EMAIL) {
    sendFeedbackEmail({
      to: process.env.FEEDBACK_EMAIL,
      type,
      message: trimmedMessage,
      email: email?.trim() || null,
      pageUrl: pageUrl || null,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
