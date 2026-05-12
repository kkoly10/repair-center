# repair-center – Claude Code session context

This file is the source of truth for ongoing work. Update it when tasks are completed or new ones are identified.

---

## Project: Multi-tenant SaaS conversion

Converting the app from a single-shop platform to multi-tenant. Work is organized in sprints.

### Supabase project
- **Project ID**: `bpchjjgilooaztqipdkt`
- **Migrations applied directly** via `POST https://api.supabase.com/v1/projects/bpchjjgilooaztqipdkt/database/query` with the PAT stored in `.claude/settings.json` (gitignored). The Supabase MCP is authenticated to a different account and cannot be used for this project.

---

## Sprint 1 — Database foundation ✅ COMPLETE (merged)

### Migrations (all applied to production)
- `20260511_001_organizations.sql` — org tables + tenant helper functions + RLS
- `20260511_002_add_organization_id.sql` — nullable `organization_id` FK on 14 tables + indexes + org seed + backfill
- `20260511_003_org_not_null_and_rls.sql` — NOT NULL on core tables (customers, quote_requests, quote_estimates, repair_orders, pricing_rules) + org-scoped RLS policies
- `20260512_004_child_tables_not_null_org.sql` — NOT NULL on child tables (payments, repair_messages, shipments, notifications, repair_order_status_history, device_intake_reports, quote_request_photos, customer_addresses, quote_estimate_items)
- `20260512_005_fix_status_history_trigger_org_id.sql` — Fixed `log_repair_order_status_change()` trigger to include `organization_id: new.organization_id` in both INSERTs

### Bug fixes applied
- Fixed infinite RLS recursion in `is_staff`, `is_admin`, `current_user_role` (missing SECURITY DEFINER)
- Fixed migration 003 idempotency (added DROP POLICY IF EXISTS guards)
- Fixed migration 002 FK safety: `organization_members` insert now guarded with `IF EXISTS (auth.users)` so it's safe on fresh databases without the hardcoded UUID

---

## Sprint 2 — Application code ✅ COMPLETE (merged)

### What was done
- **`lib/admin/org.js`** (new) — cached `getDefaultOrgId()` helper for single-tenant phase
- **`proxy.js`** — updated from `profiles.role` check to `organization_members`; falls back to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **`utils/supabase/middleware.js`** — fixed return type to `{ supabase, response }`
- **`components/AdminAuthGate.js`** — updated to use `organization_members` instead of `profiles`
- **`lib/mailInConfig.js`** — replaced static export with async `getMailInConfig(orgId)` reading from `organization_settings` + `organizations`
- **`lib/notifications.js`** — fetches org name in `getQuoteNotificationContext`; `wrapEmail` uses per-org brand; `organization_id` on all notification inserts
- **`lib/sms.js`** — SMS suffix uses org name from context; `organization_id` on all SMS log inserts
- **`lib/finalBalanceNotifications.js`** — `organization_id` on insert; org name in email header
- **`lib/finalBalancePaidNotifications.js`** — `organization_id` on insert; org name in email header
- **`lib/followUpEmails.js`** — `organization_id` on insert; org name via `wrapEmail`
- **`lib/payments/finalizeFinalBalancePayment.js`** — `organization_id` on `payments` insert (reads from `repair_orders`)
- **`lib/admin/quotes.js`** — `listQuoteRequests` now filters by `organization_id`
- **API routes updated** (org filter on reads + org_id on inserts):
  - `app/api/quote-requests/route.js` — customers, quote_requests, quote_request_photos
  - `app/api/payments/intent/route.js` — Stripe PaymentIntent metadata
  - `app/api/payments/webhook/route.js` — repair_orders, payments (both paths)
  - `app/api/mail-in/[quoteId]/route.js` — uses `getMailInConfig`
  - `app/admin/api/quotes/[quoteId]/send-estimate/route.js` — quote_estimates, quote_estimate_items (all 5 variants)
  - `app/admin/api/quotes/[quoteId]/revised-estimate/route.js` — same as send-estimate
  - `app/admin/api/quotes/[quoteId]/order/route.js` — repair_orders, shipments
  - `app/admin/api/quotes/[quoteId]/messages/route.js` — repair_messages
  - `app/admin/api/quotes/[quoteId]/intake/route.js` — device_intake_reports

### Known Sprint 2 limitation
`getDefaultOrgId()` selects the oldest organization row — intentional for single-tenant transition. **Sprint 3 must replace this** with per-request org resolution from the authenticated user's `organization_members` row.

---

## Sprint 3a — Session-based org resolution in admin routes ✅ COMPLETE (PR #11)

### What was done
- **`lib/admin/getSessionOrgId.js`** (new) — reads auth session from cookies via `@supabase/ssr`, looks up `organization_members`, throws 401/403 with `.status` property; falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` if publishable key not set
- **All admin API route handlers updated** to call `getSessionOrgId()` before the main try/catch and filter all DB reads by `organization_id`:
  - `send-estimate`, `revised-estimate`, `order` (GET+POST), `intake` (GET+POST), `messages` (GET+POST), `analytics` (10 queries), `sla`, `estimates/[estimateId]`, `payment-summary`, `request-final-balance`
- **`getPaymentSummary.js`** — optional `orgId` param on `getPaymentSummaryByQuoteId` (public callers omit it safely)
- **`intent/route.js`** — uses `quoteRequest.organization_id` instead of `getDefaultOrgId()`
- **`webhook/route.js`** — derives `orgId` from fetched `quoteRequest.organization_id`

---

## Sprint 3b — Remaining multi-tenancy tasks ✅ COMPLETE (PR #11)

### What was done
- **Technicians fix** — `order/route.js` GET now queries `organization_members` joined to `profiles` (org-scoped), maps data to same `{ id, full_name, role }` shape
- **Public slug routing** — `EstimateForm` reads `orgSlug` from prop or `?shop=` query param, sends it in form body; `/api/quote-requests/route.js` resolves org from slug before falling back to `getDefaultOrgId()`; `/shop/[orgSlug]/estimate/page.js` added as the per-shop URL
- **DB migration 006** — `organization_invitations` table with token + expiry + RLS policies
- **Admin settings** — `/admin/settings/` page + `GET/POST /admin/api/settings/` (org info, receiving address, branding)
- **Admin team management** — `/admin/team/` page + `GET /admin/api/team/` (members + pending invites) + `POST/DELETE /admin/api/team/invite/` + `PATCH/DELETE /admin/api/team/[memberId]/`
- **Invite flow** — `GET/POST /api/invitations/[token]/` (public) + `/invite/[token]/` accept page
- **Self-serve signup** — `/signup/` page + `POST /api/auth/create-org/` (creates org + adds user as owner + seeds settings/branding/payment tables)
- **Onboarding** — `/admin/onboarding/` page for new users with no org membership

---

## Sprint 3c — Multi-tenant gap audit and hardening ✅ COMPLETE

### Audit findings fixed
1. **`app/api/quote-requests/route.js`** — `customers` SELECT now includes `.eq('organization_id', orgId)`; `customers` UPDATE now includes `.eq('organization_id', orgId)` guard; `pricing_rules` SELECT now includes `.eq('organization_id', orgId)`
2. **`app/api/estimate-review/[quoteId]/route.js`** — `repair_orders` INSERT was missing `organization_id`; now includes `organization_id: quoteRequest.organization_id`
3. **`app/api/customer-portal/route.js`** — Completely rewrote to accept `orgSlug` in POST body; resolves org from slug (falls back to `getDefaultOrgId()`); `customers` SELECT and `quote_requests` SELECT both include `.eq('organization_id', orgId)`. Downstream `repair_orders` and `payments` are implicitly scoped via the org-filtered quote IDs
4. **`supabase/migrations/20260512_007_pricing_rules_rls.sql`** — Drops `pricing_rules_public_select` policy that exposed ALL active pricing from ALL orgs to anonymous users. Applied to production
5. **`app/api/pricing/[shopSlug]/route.js`** (NEW) — Public endpoint returning active pricing rules scoped to a single organization by slug; replaces the removed RLS-based public access

### Accepted risks (not fixed — low blast radius)
- Public routes that look up by `quote_id` (estimate-review, mail-in, track, payments/intent) do NOT filter by org on the initial quote fetch — the `quote_id` is a non-guessable identifier issued only to the submitting customer, and all routes require email verification as a second factor. Risk: near-zero in practice
- `getPaymentSummaryByQuoteId` accepts optional `orgId` — `final-summary` public route calls it without org context; same email-verification defense applies
- Webhook route (`payments/webhook`) processes by Stripe-verified metadata — no org scoping needed since data origin is our own Stripe PaymentIntent metadata

### Remaining Sprint 3b/3c items (not yet started)
- [ ] Admin UI pages for settings, team, onboarding need connecting to production data (components built, pages wired, but not battle-tested with real multi-org data)
- [ ] `getDefaultOrgId()` still used in `customer-portal` and `quote-requests` fallback paths — intentional for single-tenant compatibility; will be removed when all shops have slugs

---

## Environment notes
- Next.js on Vercel — uses `proxy.js` (not `middleware.js`) as the edge middleware file
- Supabase publishable key env var: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (also falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in proxy.js)
- Service role key in `SUPABASE_SERVICE_ROLE_KEY` — used by `lib/supabase/admin.js`
- Stripe webhook secret in `STRIPE_WEBHOOK_SECRET`
