import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import {
  createPortalChallengeValue,
  CUSTOMER_PORTAL_CHALLENGE_COOKIE,
  getChallengeExpiryTimestamp,
  getPortalChallengeCookieOptions,
  normalizePortalEmail,
} from '../../../../lib/security/customerPortalVerification'

export const runtime = 'nodejs'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@example.com'

export async function POST(request) {
  const supabase = getSupabaseAdmin()

  try {
    const body = await request.json()
    const email = normalizePortalEmail(body?.email)

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email is required.' }, { status: 400 })
    }

    const hasRepairHistory = await checkForCustomerRepairHistory({ supabase, email })

    let previewCode = null
    let cookieValue = null

    if (hasRepairHistory) {
      const code = String(crypto.randomInt(100000, 1000000))
      const expiresAt = getChallengeExpiryTimestamp()
      cookieValue = createPortalChallengeValue({ email, code, expiresAt })

      await sendPortalVerificationCode({ email, code })

      if (!resend && process.env.NODE_ENV !== 'production') {
        previewCode = code
      }
    }

    const response = NextResponse.json({
      ok: true,
      message:
        'If a matching repair record exists, we have sent a verification code to that email address.',
      ...(previewCode ? { previewCode } : {}),
    })

    if (cookieValue) {
      response.cookies.set(
        CUSTOMER_PORTAL_CHALLENGE_COOKIE,
        cookieValue,
        getPortalChallengeCookieOptions()
      )
    }

    return response
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Unable to send a verification code right now.',
      },
      { status: 500 }
    )
  }
}

async function checkForCustomerRepairHistory({ supabase, email }) {
  const { count: guestQuoteCount, error: guestQuoteError } = await supabase
    .from('quote_requests')
    .select('id', { count: 'exact', head: true })
    .ilike('guest_email', email)

  if (guestQuoteError) throw guestQuoteError
  if (Number(guestQuoteCount || 0) > 0) return true

  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('id, email')
    .ilike('email', email)
    .limit(5)

  if (customerError) throw customerError

  const customer =
    (customers || []).find((item) => normalizePortalEmail(item.email) === email) || null

  if (!customer?.id) return false

  const { count, error: quoteError } = await supabase
    .from('quote_requests')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customer.id)

  if (quoteError) throw quoteError

  return Number(count || 0) > 0
}

async function sendPortalVerificationCode({ email, code }) {
  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Portal verification email is not configured.')
    }

    console.log(`[customer-portal] verification code for ${email}: ${code}`)
    return
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Repair Center verification code',
    html: `<!DOCTYPE html>
      <html lang="en">
        <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <div style="padding:24px 28px;background:#111827;color:#ffffff;">
              <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1;">Repair Center</div>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;">Your verification code</h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#e5e7eb;">Use this code to view your repair history securely.</p>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">Enter the code below on the customer portal page. It expires in 10 minutes.</p>
              <div style="display:inline-block;padding:14px 18px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:.2em;color:#111827;">${code}</div>
              <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">If you did not request this code, you can ignore this email.</p>
            </div>
          </div>
        </body>
      </html>`,
  })
}
