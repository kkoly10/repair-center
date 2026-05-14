# Launch Readiness Checklist

Operational go/no-go checklist for the public beta launch. Each item must be verified in the **production** environment, not staging or localhost.

Mark items `[x]` as you complete them.

---

## 1. Infrastructure

- [ ] `/api/health` returns `200 ok: true` on the production URL
  - Verify: `curl https://yourdomain.com/api/health`
  - Must show `checks.env.ok: true` and `checks.db.ok: true`
- [ ] Custom domain configured in Vercel and resolving
- [ ] HTTPS / TLS active (Vercel provides this automatically)
- [ ] `NEXT_PUBLIC_BASE_URL` set to the production canonical URL (no trailing slash)

## 2. Supabase

- [ ] Auth → URL Configuration → **Allowed Redirect URLs** includes:
  - `https://yourdomain.com/api/auth/callback`
  - `http://localhost:3000/api/auth/callback` (for local development)
- [ ] Database backups configured in the Supabase dashboard
- [ ] Supabase advisors linter passing (no critical security warnings)

## 3. Stripe — subscription billing

- [ ] Production (live) Stripe keys set in Vercel env vars
  - `STRIPE_SECRET_KEY` (live key, starts with `sk_live_`)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live key, starts with `pk_live_`)
- [ ] `STRIPE_BILLING_PRICE_ID` set to the live Founder Beta price ID
- [ ] `/api/billing/webhook` registered in Stripe dashboard as a webhook endpoint
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
  - `STRIPE_BILLING_WEBHOOK_SECRET` set to the signing secret for this endpoint
- [ ] End-to-end subscription test:
  - [ ] Sign up → start trial → click "Upgrade to Pro" → complete Stripe Checkout
  - [ ] `organization_subscriptions` row written; org `status` updated to `active`
  - [ ] "Manage Subscription" → Stripe Customer Portal opens and loads subscription

## 4. Stripe — repair payments

- [ ] `/api/payments/webhook` registered in Stripe dashboard as a separate webhook endpoint
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - `STRIPE_WEBHOOK_SECRET` set to the signing secret for this endpoint (different from billing)
- [ ] End-to-end repair payment test:
  - [ ] Quote → send estimate → customer approves → Stripe deposit checkout completes
  - [ ] `payments` row written; `repair_orders.inspection_deposit_paid_at` set
  - [ ] Request final balance → Stripe final balance checkout completes
  - [ ] `payments` row written for final balance

## 5. Email (Resend)

- [ ] `RESEND_API_KEY` set to a production key
- [ ] Sender domain verified in Resend dashboard
- [ ] `EMAIL_FROM` set to an address on the verified domain (e.g. `repairs@yourdomain.com`)
- [ ] Transactional email smoke tests:
  - [ ] New quote submission → admin alert email arrives
  - [ ] Estimate sent → customer receives estimate email
  - [ ] Status change to `shipped` → customer receives notification email
  - [ ] Follow-up review request email arrives for a shipped order (cron)
  - [ ] Trial warning email arrives (simulate by adjusting `trial_ends_at` temporarily)

## 6. Customer magic-link login

- [ ] Supabase Auth redirect URL allowlist configured (see §2)
- [ ] End-to-end test:
  - [ ] Navigate to `/shop/[slug]/login` → enter email → receive magic-link email
  - [ ] Click link → land on `/shop/[slug]/account`
  - [ ] Account page shows correct repair history for that customer at that shop
  - [ ] "Sign out" → redirected to login page
  - [ ] Navigate to `/shop/[slug]/account` while signed out → redirected to login

## 7. Multi-tenant isolation

- [ ] Two-shop isolation test:
  - [ ] Create two separate shop accounts (Shop A, Shop B)
  - [ ] Submit a quote to Shop A as `customer@example.com`
  - [ ] Submit a quote to Shop B as the same `customer@example.com`
  - [ ] Log in to Shop A admin → confirm Shop B's quote is not visible
  - [ ] Log in to Shop B admin → confirm Shop A's quote is not visible
  - [ ] Log in as customer at `/shop/[slug-a]/account` → only Shop A repairs shown
  - [ ] Log in as customer at `/shop/[slug-b]/account` → only Shop B repairs shown

## 8. Full end-to-end repair flow

Test the golden path from intake to receipt in **production** with real (small) amounts:

- [ ] Customer submits estimate at `/shop/[slug]/estimate`
- [ ] Admin receives new-quote alert email
- [ ] Admin reviews quote and sends estimate
- [ ] Customer receives estimate email and approves at `/shop/[slug]/estimate-review/[id]`
  - [ ] Stripe deposit payment path (if enabled)
  - [ ] Manual payment path (if enabled) — instructions shown correctly
- [ ] Customer navigates to `/shop/[slug]/mail-in/[id]` — mail-in instructions correct
- [ ] Admin updates status through repair queue (`inspection` → `repairing` → `shipped`)
- [ ] Customer receives status notification emails at each stage
- [ ] Admin generates invoice at `/admin/quotes/[id]/invoice` — renders correctly
- [ ] Admin clicks "Send Receipt" → customer receives receipt email
- [ ] Follow-up review request email sent (cron or manual trigger)
- [ ] Customer submits review at `/review/[id]` — review appears in admin Reviews page

## 9. Cron jobs

- [ ] `vercel.json` contains both cron entries:
  ```json
  { "path": "/api/cron/trial-check", "schedule": "0 9 * * *" }
  { "path": "/api/cron/follow-up",   "schedule": "0 10 * * *" }
  ```
- [ ] `CRON_SECRET` set in Vercel env vars
- [ ] Manual trigger test: `curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/trial-check`
  - Response should be `{ ok: true, processed: N, expired: N, warned: N, errors: 0 }`

## 10. Legal documents

- [ ] Attorney review of all four public legal pages completed
- [ ] `NEXT_PUBLIC_BUSINESS_NAME` set to the legal entity name
- [ ] `NEXT_PUBLIC_MAILING_ADDRESS` set to the physical mailing address
- [ ] `NEXT_PUBLIC_SUPPORT_EMAIL` set to the support contact email
- [ ] `NEXT_PUBLIC_PRIVACY_EMAIL` set to the privacy contact email
- [ ] Governing law clause (Virginia) confirmed or updated with attorney

---

## Sign-off

| Area | Verified by | Date |
|---|---|---|
| Infrastructure | | |
| Supabase | | |
| Stripe billing | | |
| Stripe repair payments | | |
| Email | | |
| Customer login | | |
| Multi-tenant isolation | | |
| Full repair flow | | |
| Cron jobs | | |
| Legal docs | | |
