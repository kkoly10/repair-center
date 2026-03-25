# Repair Center Public Launch Readiness

This document tracks the code-side systems that must be configured before a public launch.

## What is now implemented

### Core repair flow
- Quote request intake
- Admin quote review
- Estimate builder
- Customer estimate review
- Mail-in instructions page
- Repair tracking page
- Admin repair-order management
- Revised and final estimate workflow

### Payment flow
- Stripe inspection deposit intent route
- Stripe inspection deposit webhook finalization
- Stripe inspection deposit verify route
- Customer deposit checkout page
- Customer deposit completion page
- Final balance summary route
- Final balance intent route
- Final balance verify route
- Customer final balance checkout page
- Customer final balance completion page
- Reusable payment summary helper
- Final balance finalization helper
- Admin payment summary API

### Notifications
- Reusable Resend-backed notification layer in `lib/notifications.js`
- Notification logging table through Supabase migration
- Estimate sent notification hooks
- Deposit-paid notification hooks
- Mail-in-ready notification hooks
- Repair status update notification hooks
- Shipment update notification hooks

## Required environment variables

Set these in Vercel for production and in your local `.env.local` for development.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=
EMAIL_FROM=repairs@yourdomain.com
NOTIFICATIONS_EMAIL_ENABLED=true

NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Required Supabase migrations

Apply all repo migrations, including:
- repair center core schema
- any trigger/history migrations already in repo
- `20260324_notifications_log.sql`

## Required Stripe setup

1. Add your live publishable key and secret key.
2. Add a webhook endpoint for production pointing to:
   - `https://yourdomain.com/api/payments/webhook`
3. Subscribe the webhook to at least:
   - `payment_intent.succeeded`
4. Copy the live webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Run an end-to-end live or test mode payment smoke test.

## Required Resend setup

1. Verify the sending domain in Resend.
2. Set `EMAIL_FROM` to an address on that verified domain.
3. Add `RESEND_API_KEY`.
4. Trigger a real estimate email and a shipment email in test mode to verify deliverability.

## Required business-config values to replace

Check any business config files and replace placeholders for:
- business name if needed
- support email
- support phone
- receiving address
- mail-in instructions text
- repair policies and warranty language

## Recommended smoke tests before launch

### Estimate and approval
- Submit a quote
- Admin sends estimate
- Customer receives estimate email
- Customer approves estimate
- If deposit required: customer is routed into payment flow
- If no deposit required: customer is routed into mail-in instructions

### Deposit payment
- Customer completes deposit payment
- Webhook finalizes payment
- Payment verify page works even if page is refreshed
- Repair order is created only once
- Deposit payment record is created only once
- Customer receives deposit confirmation / mail-in-ready email

### Revised estimate
- Intake reveals additional work
- Admin sends revised estimate
- Customer receives updated estimate email
- Customer approves revised estimate
- Tracking remains correct and does not incorrectly reset to pre-intake flow

### Final balance
- Order moves to `awaiting_balance_payment`
- Customer can open balance payment page
- Final balance intent is created
- Final balance verify finalizes payment only once
- Order can move to `ready_to_ship`

### Shipping and tracking
- Admin marks status with customer-visible note
- Tracking page updates correctly
- Shipment record can be created/updated
- Shipment email sends when outbound tracking is added
- Delivered status can be marked

## Remaining manual / non-code tasks

These are not solved by code alone.

- Replace placeholder receiving address and support contact information
- Finalize repair policies, warranty language, and public legal copy
- Verify live Stripe and Resend production credentials
- Decide operational SLA for turnaround and support replies
- Prepare packing materials / label workflow / receiving process
- Decide whether balance payment is always required before outbound shipping or whether staff can override in rare cases
- Train staff/admins on the order-status workflow

## Launch recommendation

The repo is approaching public-launch readiness, but do not launch broadly until:
- production env vars are set
- live Stripe webhook is confirmed
- Resend domain is verified
- notification emails are tested
- mail-in address and support info are real
- full end-to-end payment + tracking smoke tests pass
