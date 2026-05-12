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

## Sprint 3b — Remaining multi-tenancy tasks 🔲 NOT STARTED

- [ ] Public-facing routes: resolve org via subdomain or slug (URL routing signal)
- [ ] `order/route.js` GET — technicians query reads from `profiles` filtered by `role`; should instead query `organization_members` joined to `profiles` so only staff from the correct org are returned
- [ ] Admin UI: org settings page (business name, support email/phone, receiving address, packing checklist, shipping notes → `organization_settings` table)
- [ ] Invite flow: add staff members to `organization_members`
- [ ] Onboarding: create new org records for additional tenants

---

## Environment notes
- Next.js on Vercel — uses `proxy.js` (not `middleware.js`) as the edge middleware file
- Supabase publishable key env var: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (also falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in proxy.js)
- Service role key in `SUPABASE_SERVICE_ROLE_KEY` — used by `lib/supabase/admin.js`
- Stripe webhook secret in `STRIPE_WEBHOOK_SECRET`
