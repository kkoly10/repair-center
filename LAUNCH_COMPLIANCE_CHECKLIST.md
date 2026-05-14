# Launch Compliance Checklist

This is the final-mile checklist before opening the platform to the public. All items below must be **owner-reviewed** and the legal-document items must be **attorney-reviewed** before launch.

Use this file as a living checklist. Update the status from `pending` to `done` (with a date) as you complete each item.

---

## Legal documents

- [ ] **Platform Terms of Service** reviewed by attorney — `pending`
- [ ] **Customer Terms of Service** reviewed by attorney — `pending`
- [ ] **Privacy Policy** reviewed by attorney — `pending`
- [ ] **Shop Responsibility page** reviewed by attorney — `pending`
- [ ] **Returns & Refunds page** reviewed by attorney — `pending`
- [ ] **Governing law and venue** confirmed — `pending` (currently placeholder: Virginia)
- [ ] **Business entity name** filled in on all policy pages — `pending` (currently `[business entity name]`)
- [ ] **Platform mailing address** filled in on all policy pages — `pending`
- [ ] **Privacy email** filled in on Privacy Policy and Platform Terms — `pending`
- [ ] **Support email** filled in on contact and platform terms — `pending` (`NEXT_PUBLIC_CONTACT_EMAIL` env var)

## Payments

- [ ] **Stripe billing live mode** — production keys set in Vercel — `pending`
  - `STRIPE_SECRET_KEY` (live)
  - `STRIPE_BILLING_WEBHOOK_SECRET`
  - `STRIPE_BILLING_PRICE_ID` (the $29 Founder Beta price)
- [ ] **Stripe billing webhook** end-to-end live test — `pending`
  - Trigger `checkout.session.completed`, confirm `organization_subscriptions` row is written
  - Trigger `customer.subscription.deleted`, confirm org status updates
- [ ] **Stripe repair payment** end-to-end live test — `pending`
  - Quote → estimate → deposit Stripe payment → final balance Stripe payment → webhook updates `payments` and `repair_orders`

## Email & SMS

- [ ] **Resend production API key** set, sender domain verified — `pending`
- [ ] **EMAIL_FROM** env var set to a verified sender on a domain you control — `pending`
- [ ] **NEXT_PUBLIC_BASE_URL** set to the production canonical URL — `pending`
- [ ] **Twilio SMS** keys configured (if enabling SMS) — `pending`
- [ ] **Email link tampering protection** — `EMAIL_LINK_SECRET` set in production — `pending`

## Authentication

- [ ] **Supabase Auth redirect URL allowlist** updated with the production `/api/auth/callback` URL — `pending`

## Database & isolation

- [ ] **Supabase advisors review** — run `mcp` get_advisors or the Supabase dashboard linter; resolve security and performance warnings — `pending`
- [ ] **Two-shop isolation manual test** — create two shops, submit a quote to each as the same customer email, confirm staff in shop A cannot see shop B&apos;s quote/customer/order rows — `pending`
- [ ] **RLS smoke test** — `select * from quote_requests` as `anon` returns 0 rows; same for `customers`, `repair_orders`, `payments`, `repair_messages` — `pending`
- [ ] **Backups configured** in Supabase dashboard — `pending`

## Cron jobs

- [ ] **vercel.json** crons deployed: `/api/cron/trial-check` (daily 8 UTC) and `/api/cron/follow-up` (daily 10 UTC) — `pending`
- [ ] **CRON_SECRET** set in Vercel env vars, matching cron job Authorization header — `pending`

## Review compliance

- [ ] Review request email is sent to ALL shipped customers (no sentiment filter) — `done` (verified in `lib/followUpEmails.js`)
- [ ] No incentives offered for reviews — `done` (verified in code; confirm no future marketing material says otherwise)
- [ ] Admin cannot edit or delete a customer&apos;s review text — `pending` (currently no admin write API for `repair_reviews`, which is the safe default; keep it that way)

## Trial / cancellation flow

- [ ] Trial expiry email actually arrives (3-day and 1-day warnings) — `pending`
- [ ] Suspended state actually blocks `/admin/*` and routes to `/admin/suspended` — `done` (proxy.js verified)
- [ ] Cancellation via Stripe Customer Portal is reachable from `/admin/billing` and completes a webhook round-trip — `pending`

## Contact / public surface

- [ ] `/contact` page reachable and email link works — `done` (page exists; verify env var is set)
- [ ] `/for-shops` page reachable; all CTAs work — `done`
- [ ] Footer policy links all resolve to non-404 pages — `pending` (verify after deploy)
- [ ] `robots.txt` / `sitemap.xml` configured if SEO is desired — `pending`

## Production domain

- [ ] Custom production domain configured in Vercel — `pending`
- [ ] HTTPS / TLS configured — `pending` (Vercel default)
- [ ] `NEXT_PUBLIC_BASE_URL` matches the production domain — `pending`
- [ ] Stripe webhook endpoint URL points to the production domain — `pending`

## Monitoring

- [ ] Sentry (or other error tracking) configured — `pending`
- [ ] Health-check endpoint smoke-tested — `pending`
- [ ] At least one staging environment for QA — `pending`

## After-launch checks (first 14 days)

- [ ] Daily smoke test: submit a quote, view it as admin, send an estimate, simulate a payment
- [ ] Daily review of failed notifications in the `notifications` table
- [ ] Daily review of error logs in Sentry or Vercel
- [ ] Confirm at least one shop has completed a real end-to-end repair flow
