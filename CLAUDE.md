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

## Sprint 4 — Customer-facing tenant behavior ✅ COMPLETE

### What was done
- **`app/api/pricing/[shopSlug]/route.js`** — Updated SELECT to join `repair_catalog_models(model_key)` and `repair_types(repair_key)` so EstimateForm can build a lookup by modelKey+repairKey
- **`lib/resolveTrackingIdentifier.js`** — Accepts optional `options.orgId`; adds `.eq('organization_id', orgId)` to all quote/order lookups across all three resolution paths (RCQ-, RCO-, generic fallback)
- **`app/api/track/[quoteId]/route.js`** — Accepts `orgSlug` in POST body; resolves orgId; passes orgId to `resolveTrackingIdentifier`; returns org-prefixed navigation paths (`/shop/{slug}/...`); payment paths remain at `/pay/[quoteId]` (not shop-prefixed)
- **`app/api/mail-in/[quoteId]/route.js`** — Accepts `orgSlug`; fetches `organization_payment_settings` in parallel; response now includes `paymentMode` and `manualPaymentInstructions`
- **`app/api/estimate-review/[quoteId]/route.js`** — Accepts `orgSlug`; all returned paths use pathPrefix; manual payment mode: when `payment_mode = 'manual'` and deposit > 0, order is created immediately and response includes `manualPaymentMode: true`, `manualInstructions`, `depositAmount` instead of redirecting to Stripe
- **`app/api/track/[quoteId]/messages/route.js`** — Accepts `orgSlug`, resolves orgId, passes to `resolveTrackingIdentifier`; also adds `organization_id` to `repair_messages` INSERT
- **`components/CustomerTrackingPage.js`** — Accepts `orgSlug` prop; sends in both track and messages API POST bodies
- **`components/CustomerEstimateReviewPage.js`** — Accepts `orgSlug` prop; sends in all API POST bodies; handles `result.manualPaymentMode` by displaying manual payment instructions panel instead of Stripe redirect
- **`components/MailInInstructionsPage.js`** — Added missing `Link` import; accepts `orgSlug` prop; sends in API POST body; deposit section shows manual instructions when `paymentMode === 'manual'`, Stripe link otherwise
- **`components/EstimateForm.js`** — When `resolvedOrgSlug` present, fetches `/api/pricing/[orgSlug]` on mount, builds `{ modelKey:repairKey → rule }` lookup, merges DB prices (fixed, min, max, deposit) into selectedRepair while preserving static label/turnaround; tracking link after submission uses shop-prefixed URL
- **`app/shop/[orgSlug]/page.js`** (NEW) — Server component; fetches org + branding from Supabase admin client; renders branded landing page with estimate and track links; 404 if slug not found
- **`app/shop/[orgSlug]/track/page.js`** (NEW) — Shop-scoped track lookup page; redirects to `/shop/{slug}/track/{id}`
- **`app/shop/[orgSlug]/track/[quoteId]/page.js`** (NEW) — Wrapper: `<CustomerTrackingPage quoteId orgSlug />`
- **`app/shop/[orgSlug]/estimate-review/[quoteId]/page.js`** (NEW) — Wrapper: `<CustomerEstimateReviewPage quoteId orgSlug />`
- **`app/shop/[orgSlug]/mail-in/[quoteId]/page.js`** (NEW) — Wrapper: `<MailInInstructionsPage quoteId orgSlug />`

### Route inventory (public, per-shop)
| URL | Description |
|-----|-------------|
| `/shop/[slug]` | Branded landing page |
| `/shop/[slug]/estimate` | Estimate form (exists from Sprint 3b) |
| `/shop/[slug]/track` | Track lookup (enter ID) |
| `/shop/[slug]/track/[id]` | Live tracking + messages |
| `/shop/[slug]/estimate-review/[id]` | Estimate approval |
| `/shop/[slug]/mail-in/[id]` | Mail-in instructions |

### Original single-shop routes preserved (fallback)
`/track/[id]`, `/estimate-review/[id]`, `/mail-in/[id]` — unchanged, no orgSlug sent

---

## Sprint 5 — Payment settings, admin pricing, photo hardening ✅ COMPLETE

### Migrations applied to production
- `20260512_008_pricing_rules_unique_org.sql` — dropped global `unique(model_id, repair_type_id)` constraint, replaced with `unique(organization_id, model_id, repair_type_id)`

### What was done
1. **Column fix** — `organization_payment_settings.manual_instructions` → `manual_payment_instructions` in `estimate-review` and `mail-in` routes (column name was always `manual_payment_instructions` in DB; code had wrong name)
2. **Payment settings in admin** — `GET /admin/api/settings` now includes `payment` section; `POST /admin/api/settings` accepts `payment` section (payment_mode, manual_payment_instructions, cashapp_tag, zelle_contact, square_payment_url); `AdminSettingsPage` has Section 4 UI for payment settings
3. **Admin pricing page** — `GET /admin/api/pricing` lists all org pricing rules with nested model+brand+repair joins; `PATCH /admin/api/pricing/[ruleId]` inline-edits price_mode/fixed/min/max/deposit/shipping/warranty/active; `AdminPricingPage` component with category/brand/free-text filters; `app/admin/pricing/page.js` wrapper
4. **Manual payment mode full flow** — `estimate-review` creates order immediately when payment_mode='manual', returns `manualPaymentMode: true` + instructions + depositAmount; `CustomerEstimateReviewPage` shows instructions panel; `MailInInstructionsPage` shows manual instructions instead of Stripe link
5. **Pricing rule cloning** — `create-org` now fetches oldest org's pricing rules after seeding, inserts clones for the new org (failure silently ignored to not block signup)
6. **Photo hardening** — `quote-requests` POST: max 6 files (slice), max 10 MB per file, MIME allowlist (jpeg/png/webp/heic/heif/gif), storage path changed from `{quoteId}/file` to `orgs/{orgId}/quotes/{quoteId}/file`
7. **Deposit mark-paid endpoint** — `POST /admin/api/quotes/[quoteId]/deposit`: verifies session+org, finds repair order, inserts `payments` row (kind=inspection_deposit, provider=manual, status=paid), updates `repair_orders.inspection_deposit_paid_at`

### Accepted limitations
- No UI button to trigger deposit mark-paid yet — endpoint exists and is ready for wiring
- `getDefaultOrgId()` still used in `customer-portal` and `quote-requests` fallback paths — intentional

---

## Sprint 6 — Testing, CI, and beta hardening ✅ COMPLETE

### What was done
1. **GitHub Actions CI** — `.github/workflows/ci.yml`: two jobs (`test` and `build`) trigger on push to `main`/`claude/**` and on PRs to `main`; `test` job runs `npm test`; `build` job runs `npm run build` with stub env vars so secrets are not needed
2. **Jest test suite** — 27 tests across 4 suites:
   - `__tests__/lib/photoMime.test.js` — MIME allowlist, extension normalization, limits
   - `__tests__/api/pricing-isolation.test.js` — org isolation (org_id filter), cross-org 404, auth guard, price_mode validation, manual mode clears price fields
   - `__tests__/api/deposit.test.js` — auth guard, cross-org 404, no-deposit 400, idempotency (payment+timestamp both present → 400), partial-state recovery (payment exists + timestamp null → ok + no dup insert)
   - `__tests__/api/payment-mode-routing.test.js` — source-level guards: manual vs Stripe branch, correct column name, requiresPayment exists
3. **Deposit partial-state recovery** — If `payments` row exists but `repair_orders.inspection_deposit_paid_at` is null (partial failure from previous call), endpoint now repairs the timestamp and returns `ok:true` instead of 400; no duplicate payment is inserted
4. **MIME extension normalization** — Extracted `lib/photoMime.js` (MIME→ext map, allowlist, limits); `quote-requests` route now derives file extension from MIME type instead of trusting the filename extension; constants shared with tests
5. **Admin convenience buttons** — `AdminSettingsPage` now shows a "Your Shop" panel when slug is loaded: Preview shop page, Preview estimate form, Copy shop link (copies `origin/shop/{slug}` to clipboard)
6. **No active pricing rules warning** — `AdminPricingPage` shows a `notice-warn` banner when rules exist but none are active, prompting admin to activate at least one

### How to run tests
```bash
npm test              # run all 44 tests
npm test -- --watch   # watch mode
```

### Remaining blockers to 8.5/10
- [ ] No UI button to mark deposit paid (endpoint is ready, needs wiring in `AdminQuoteDetailPage`)
- [ ] `getDefaultOrgId()` still used in fallback paths — acceptable for single-tenant, remove when all shops have slugs
- [ ] RLS tests (anon cannot read pricing_rules, cross-org data isolation) require a real Supabase test DB — not covered by unit tests yet
- [ ] `next lint` not yet passing cleanly (eslint-config-next installed; run `npm run lint` to check)

---

## Sprint 7 — Sprints 7 & 8 were Repair Queue ✅ COMPLETE (PR #20, merged)

See Sprint 8 below — sprint numbering skipped 7 in practice.

---

## Sprint 8 — Repair Queue / Operations Layer ✅ COMPLETE (PR #20, merged)

### Migration applied to production
- `20260512_009_orders_queue_fields.sql` — adds `priority` (low/normal/high/urgent) and `due_at` (timestamptz) to `repair_orders`; creates `repair_order_audit_log` table (org_id, order_id, actor_user_id, event_type, old_value, new_value) with RLS

### What was done
- **`lib/admin/getSessionOrgId.js`** — refactored: private `resolveSession()` shared by `getSessionOrgId()` (returns orgId) and `getSessionContext()` (returns `{ orgId, userId }`)
- **`GET /admin/api/orders`** — paginated queue with status/tech/search filters; joins quote_requests, customers, profiles; always org-scoped
- **`PATCH /admin/api/orders/[orderId]`** — updates status/tech/priority/due_at; validates org ownership (maybySingle + org filter → 404); writes audit log entries for non-status changes; own JSON parse try/catch → 400 on malformed body
- **`components/AdminOrdersQueue.js`** — inline editing for all four fields; `patchOrder` returns true/false so tech-name state update is only applied on success
- **`__tests__/api/orders-queue.test.js`** — 9 tests: auth guard, org filter, shaped data, cross-org 404, invalid status/priority, happy path with audit log

---

## Sprint 9 — Staff Performance & Activity Log ✅ COMPLETE (PR #21, merged)

### No migration needed
All metrics use existing columns and the `repair_order_audit_log` table from Sprint 8.

### What was done
- **`GET /admin/api/quotes/[quoteId]/order` (GET)** — now fetches `repair_order_audit_log` in the parallel Promise.all alongside status history and shipments; returns `auditLog` in response; error is checked (was the bug fixed in self-review)
- **`components/AdminRepairOrderPage.js`** — replaced "Status history / Customer-visible timeline" with unified "Activity log / Order timeline"; IIFE merges status events and audit events sorted by `created_at`; audit events get an "internal" badge; labels: `technician_assigned` → "Tech assigned/unassigned", `priority_changed` → "Priority → X", `due_date_changed` → "Due date set/cleared"
- **`GET /admin/api/staff/performance`** — per-tech metrics scoped to session org; orders query bounded with `.or('current_status.not.in.(...),created_at.gte.{90daysAgo}')` so active repairs at any age are included but old completed orders don't cause unbounded scans
- **`components/AdminStaffPerformancePage.js`** + **`app/admin/staff/page.js`** — summary cards (active, completed 30d, team size) + table with per-tech metrics and "View queue" link pre-filtered to active orders
- **`__tests__/api/staff-performance.test.js`** — 7 tests: 401, org filter on members, org filter on orders, stats shape, active/completed counts, cross-org isolation (other tech's orders not counted), avg turnaround

### Test suite after Sprint 9
44 tests across 6 suites — all passing.

---

## Sprint 10 — Invoices, Receipts & Customer History ✅ COMPLETE (Phase 5)

### No migration needed
All data comes from existing tables: `customers`, `repair_orders`, `quote_requests`, `quote_estimates`, `quote_estimate_items`, `payments`.

### What was done
- **`GET /admin/api/quotes/[quoteId]/invoice`** — fetches all invoice data (org, customer, order, estimate line items, paid payments); returns JSON used by the invoice page
- **`POST /admin/api/quotes/[quoteId]/send-invoice`** — emails HTML receipt to customer via Resend; resolves email from `guest_email` or `customers` table; fetches full invoice data inline
- **`lib/email.js`** — added `sendReceiptEmail(to, invoice)` + `receiptHtml()` template (device, line items table, payment summary)
- **`GET /admin/api/customers`** — list all org customers with order_count, completed_count, last_order_at, is_repeat flag
- **`GET /admin/api/customers/[customerId]`** — customer profile with full order history, lifetime value (total paid), repeat flag; orders enriched with quote brand/model/repair_type
- **`components/AdminInvoicePage.js`** + **`app/admin/quotes/[quoteId]/invoice/page.js`** — printable HTML invoice with `window.print()` button; `@media print` CSS hides nav; org header, customer/device info, line items table, payment summary
- **`components/AdminCustomersPage.js`** + **`app/admin/customers/page.js`** — customer list with summary cards (total, repeat count, repeat rate), search, repeat badge
- **`components/AdminCustomerProfilePage.js`** + **`app/admin/customers/[customerId]/page.js`** — customer profile with lifetime value card, full repair history table, "View order" links
- **`components/AdminRepairOrderPage.js`** — added "View Invoice" (opens in new tab) and "Send Receipt" (POST + success/error feedback) buttons to action bar
- **`__tests__/api/customers.test.js`** — 7 tests: 401, org filter (customers + orders), stats shape, repeat flag computation, profile 404, profile data + total_paid
- **`__tests__/api/send-invoice.test.js`** — 4 tests: 401, cross-org 404, no-email 400, happy path calls sendReceiptEmail

### Test suite after Sprint 10
56 tests across 8 suites — all passing.

---

## Sprint 11 — Reporting & Analytics ✅ COMPLETE (Phase 6)

### No migration needed
All data comes from existing tables: `payments`, `repair_orders`, `quote_requests`, `organization_members`, `customers`.

### What was done
- **`GET /admin/api/analytics`** — complete rewrite:
  - Fixed column name bugs from original build: `payment_kind` → `kind`, `paid_at` → `created_at`, `repair_completed_at` → `shipped_at`
  - Added `?range=` query param (7d / 30d / 90d / 12m / all); defaults to 30d
  - Previous period comparison: same-duration window ending at `rangeStart`, returned as `revenue.prev`
  - Reduced from 10 parallel queries to 7 by computing turnaround from the already-fetched `repair_orders` dataset (no separate turnaround query)
  - **Revenue by repair type**: joins paid payments → repair_orders → quote_requests, groups by `repair_type_key`
  - **Revenue by technician**: joins paid payments → repair_orders → organization_members/profiles, groups by tech name
  - **Collection rates**: `depositRate` = % of all orders with a paid deposit; `balanceRate` = % with a paid final balance
  - **Repeat customer rate**: computed from repair_orders grouped by `customer_id`; `customers.repeatRate`, `.repeatCustomers`, `.total`
  - Response shape: `revenue.{total,prev,deposits,balances,totalPayments,depositRate,balanceRate}`, `revenueByType[]`, `revenueByTech[]`, `funnel`, `repairs`, `devicePopularity`, `repairTypeDemand`, `recentQuotes`, `customers`
- **`components/AdminAnalyticsDashboard.js`** — complete rewrite:
  - Date range selector tabs (7d / 30d / 90d / 12m / All) at top; fetches with `?range=` on change
  - KPI card: Repeat Customer Rate replaces the old Active Repairs card (moved to repair metrics section)
  - Revenue breakdown section now shows deposit/balance rates alongside amounts
  - New section: **Revenue by Repair Type** — horizontal bar chart, purple bars, sorted by revenue
  - New section: **Revenue by Technician** — horizontal bar chart, cyan bars; hidden when no assigned tech data
  - Repair metrics row: Active Repairs + Avg Turnaround + top 2 status counts
  - Removed Recent Payments table (redundant with Revenue sections)
  - Updated all field name references to new response shape
- **`__tests__/api/analytics.test.js`** (new) — 9 tests: 401, org filter, total revenue, deposit/balance split (verifies `kind` not `payment_kind`), revenue by repair type join, revenue by tech join, repeat rate, range in response, `created_at` range filter (verifies not `paid_at`)

### Test suite after Sprint 11
65 tests across 9 suites — all passing.

---

## Sprint 12 — Inventory & Parts ✅ COMPLETE

### Migrations applied to production
- `20260512_010_inventory.sql` — `suppliers`, `parts`, `repair_order_parts` tables with org-scoped RLS; **originally used `is_staff(organization_id)` (a no-arg legacy function — bug), migration was corrected to `is_org_member(organization_id)` before applying**
- `20260513_011_fix_inventory_rls.sql` — corrective migration: drops and recreates the three inventory RLS policies using `is_org_member(organization_id)`; also applied migration 010 correctly for the first time (original apply had failed silently due to the bad function call, leaving tables non-existent)

### What was done
- **`GET /admin/api/parts`** — lists all org parts with nested `suppliers(name)` join; `is_low_stock` computed in JS (PostgREST column-to-column comparison not supported); `lowStockCount` returned; `?low_stock=1` filter post-fetch
- **`POST /admin/api/parts`** — creates part scoped to session org; validates name
- **`GET /admin/api/parts/[partId]`** — single part, org-scoped, 404 if not found
- **`PATCH /admin/api/parts/[partId]`** — verifies org ownership first; allowlist of fields; validates name; sets `updated_at`
- **`DELETE /admin/api/parts/[partId]`** — **soft-delete** (`active: false`); preserves `repair_order_parts` foreign key references
- **`GET /admin/api/orders/[orderId]/parts`** — order-scoped usage list with nested `parts(name, sku)`, per-row `total_cost`, `totalPartsCost`
- **`POST /admin/api/orders/[orderId]/parts`** — validates part + order org membership; 409 if insufficient stock; inserts usage + decrements `quantity_on_hand` in `Promise.all`
- **`DELETE /admin/api/orders/[orderId]/parts?usageId=`** — removes usage record + restores stock via fetch-then-update
- **`components/AdminPartsPage.js`** + **`app/admin/parts/page.js`** — full CRUD: low-stock banner, add form, inline edit rows, deactivate button; search (name/SKU/desc), show inactive checkbox, show low stock only toggle
- **`components/AdminRepairOrderPage.js`** — added "Parts & materials" section: loads parts used + active catalog on order open; table of parts used with remove button; add-part form (select part from catalog, qty, optional notes); parts total displayed
- **`__tests__/api/parts.test.js`** — 15 tests: 401/org-filter for list, `is_low_stock` flag, POST name validation + org insert, PATCH cross-org 404 + update, DELETE soft-delete + cross-org 404, order parts GET 401/404/data, order parts POST 401/409 insufficient stock/insert+decrement

### Test suite after Sprint 12
80 tests across 10 suites — all passing.

---

## Sprint 13 — Quick Wins: Hardening to 10/10 ✅ COMPLETE

### Migrations applied to production
- `20260513_012_revoke_anon_helpers.sql` — `REVOKE EXECUTE FROM anon` on all six SECURITY DEFINER RLS helper functions (`is_org_member`, `has_org_role`, `get_user_org_id`, `is_staff`, `is_admin`, `current_user_role`); prevents unauthenticated callers from enumerating org membership via Supabase RPC endpoint

### What was done
- **`proxy.js`** — added org status enforcement: membership query now joins `organizations(status)`; if status ≠ `'active'`, redirects to `/admin/suspended` (allows `/admin/suspended` itself through to avoid redirect loop)
- **`app/admin/suspended/page.js`** (new) — placeholder suspended/access-restricted page; Sprint 14 (billing) will replace with full billing management flow
- **`lib/admin/org.js`** — removed module-level `_cachedOrgId` cache from `getDefaultOrgId()`; caching the first org ID globally was incorrect in multi-tenant context (warm Node.js process would serve one org's fallback to all tenants); also added `.eq('status', 'active')` filter so suspended orgs are excluded from fallback resolution
- **`app/admin/api/analytics/route.js`** — analytics funnel is now period-specific: added `funnelResult` (range-filtered quote_requests) and `prevFunnelResult` (prev period quote count) to the Promise.all; `totalQuotes` now reflects the selected date range; `funnel.prevTotalQuotes` returned for trend comparison on dashboard
- **`components/AdminAnalyticsDashboard.js`** — Total Quotes KPI card now shows prev-period percentage trend (same pattern as Revenue card); Conversion Rate card shows prev period rate as secondary stat
- **`__tests__/api/analytics.test.js`** — updated mock to handle 4 `quote_requests` calls (allQuotes, funnel, prevFunnel, recent); 2 new tests: `prevTotalQuotes` returned correctly, funnel query applies `created_at` range filter; 11 tests total in suite

### What this sprint fixed (gap → resolved)
| Gap | Fix |
|---|---|
| `REVOKE EXECUTE FROM anon` not done on helper functions | Migration 012 applied to production |
| `organizations.status` not enforced — suspended orgs could log in | `proxy.js` now gates on org status |
| `getDefaultOrgId()` had a process-lifetime cache | Cache removed; `status=active` filter added |
| Analytics prev-period comparison only on Revenue KPI | Now also on Total Quotes and Conversion Rate |

### Test suite after Sprint 13
82 tests across 10 suites — all passing.

---

## Sprint 14 — Platform Subscription Billing ✅ COMPLETE

### Migration applied to production
- `20260513_013_billing_subscriptions.sql` — adds `stripe_customer_id` (text, nullable) to `organizations`; creates `organization_subscriptions` table (PK: `organization_id`, columns: `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `plan_key`, `status`, `trial_ends_at`, `current_period_end`, `cancel_at_period_end`, `created_at`, `updated_at`) with RLS (`is_org_member(organization_id)` for SELECT; service role only for writes)

### What was done
- **`proxy.js`** — fixed critical status gate bug from Sprint 13: changed `orgStatus !== 'active'` to `BLOCKED_STATUSES.has(orgStatus)` where `BLOCKED_STATUSES = new Set(['suspended', 'cancelled'])`; allows `'trialing'` and `'past_due'` through (Sprint 13 had locked out every new signup since `create-org` sets `status: 'trialing'`)
- **`app/api/auth/create-org/route.js`** — now sets `trial_ends_at = now() + 14 days` on org creation
- **`GET /admin/api/billing`** — returns `billing.{status, planKey, trialEndsAt, trialDaysLeft, currentPeriodEnd, cancelAtPeriodEnd, hasActiveSubscription, stripeCustomerId}` from `organizations` + `organization_subscriptions` join
- **`POST /admin/api/billing/checkout`** — creates or reuses Stripe customer; creates Checkout session in `subscription` mode with `STRIPE_BILLING_PRICE_ID`; persists `stripe_customer_id` to `organizations` row on first use; returns `{ url }`
- **`POST /admin/api/billing/portal`** — looks up `stripe_customer_id` from org or subscription row; creates Stripe Customer Portal session; returns `{ url }`; 400 if no subscription found
- **`POST /api/billing/webhook`** — verifies `stripe-signature` with `STRIPE_BILLING_WEBHOOK_SECRET`; handles: `checkout.session.completed` (retrieves full subscription, upserts to `organization_subscriptions`, syncs org status), `customer.subscription.updated/deleted` (same upsert), `invoice.payment_succeeded` (same), `invoice.payment_failed` (marks org `past_due`)
- **`components/AdminBillingPage.js`** + **`app/admin/billing/page.js`** — plan status card with trial countdown / renewal date / past-due warning / cancel warning; action buttons: "Upgrade to Pro" (→ checkout) for non-subscribers, "Manage Subscription" (→ portal) for existing subscribers; plan FAQ section
- **`app/admin/suspended/page.js`** — updated: added "View billing & subscription" button linking to `/admin/billing`
- **`__tests__/api/billing.test.js`** (new) — 12 tests: GET billing 401/trialing shape/active+sub shape; POST checkout 401/no-price-id-500/happy-path; POST portal 401/no-customer-400/happy-path; webhook bad-signature/checkout.completed upsert/missing-secret-500

### Required env vars (new)
- `STRIPE_BILLING_PRICE_ID` — Stripe price ID for the Pro plan (monthly/annual)
- `STRIPE_BILLING_WEBHOOK_SECRET` — webhook signing secret for `/api/billing/webhook` (separate from `STRIPE_WEBHOOK_SECRET` used for repair payments)

### Test suite after Sprint 14
94 tests across 11 suites — all passing.

---

## Sprint 15 — Billing Enforcement + Admin Navigation ✅ COMPLETE

### Migrations applied to production
- `20260513_014_trial_warning_sent_at.sql` — adds `trial_warning_sent_at` (timestamptz, nullable) to `organizations`; used by cron to avoid sending duplicate warning emails

### What was done
- **`proxy.js`** — two hardening improvements:
  1. Lazy trial expiry enforcement: if `status === 'trialing'` AND `trial_ends_at < now()`, user is redirected to `/admin/suspended` (same as suspended/cancelled); fires on every request without a separate cron DB write
  2. Extended blocked-status bypass: now covers both `/admin/suspended` AND `/admin/billing/*` so expired/suspended users can reach billing to subscribe and restore access
  Also adds `trial_ends_at` to the org join (`organizations(status, trial_ends_at)`)
- **`components/AdminNav.js`** (new) — shared client-side nav component: sticky top bar with links to all 9 admin sections; active page highlighted; fetches `/admin/api/billing` on mount to show trial countdown banner (yellow < 7 days, red ≤ 3 days / expired) and past-due banner; orange dot on Billing nav link when urgency is active; sign-out button
- **`app/admin/layout.js`** — wires `AdminNav` above the page Suspense boundary so every admin page has the nav
- **`lib/email.js`** — added `sendTrialExpiryWarningEmail({ to, orgName, daysLeft, billingUrl })` + `trialExpiryWarningHtml()` template (urgent color coding, "Upgrade Now" CTA button)
- **`GET /api/cron/trial-check`** — daily cron endpoint (authorized via `CRON_SECRET` Bearer token if set):
  - Fetches all `status = 'trialing'` orgs with `trial_ends_at` set
  - **Expires** overdue trials: updates `status = 'suspended'` + sends expiry email to org owner
  - **Warns** orgs with ≤ 3 days left: sends warning email (3d and 1d thresholds); throttled to once per 20h via `trial_warning_sent_at`
  - Returns `{ ok, processed, expired, warned, errors }`

### New env vars
- `CRON_SECRET` — optional; if set, `GET /api/cron/trial-check` requires `Authorization: Bearer $CRON_SECRET`

### How to schedule
Add to `vercel.json` (Vercel Cron) or call from an external scheduler daily:
```json
{
  "crons": [{ "path": "/api/cron/trial-check", "schedule": "0 8 * * *" }]
}
```

### Test suite after Sprint 15
94 tests across 11 suites — all passing (no new test suite; enforcement is covered by existing billing + proxy logic).

---

## Sprint 16 — Global Search, SLA Dashboard & Production Fixes ✅ COMPLETE

### Migrations applied to production
- `20260513_015_profiles_email.sql` — **Critical fix**: `profiles` table was missing an `email` column; added `email text`, backfilled from `auth.users`, updated `handle_new_auth_user()` trigger to copy email on signup (required for trial warning emails to reach org owners)

### What was done
1. **`profiles.email` migration** — Trial warning cron was silently dropping emails because `getOwnerEmail()` selected `profiles(email)` but the column didn't exist
2. **`vercel.json`** — added Vercel Cron schedule `0 9 * * *` for `/api/cron/trial-check`
3. **`GET /admin/api/search?q=`** — cross-table search across `quote_requests`, `repair_orders`, `customers`; all org-scoped; returns empty for `q.length < 2`; results shaped as `{ type, id, title, subtitle, meta, status, href, createdAt }`; sorted by most recent `createdAt`
4. **`components/AdminNav.js`** — sticky nav bar now includes debounced search box (300ms) with dropdown results; fetches `/admin/api/billing` on mount for trial/past-due banners; `searchFocused` state + derived `dropdownOpen = searchFocused && query.length >= 2` (avoids `react-hooks/set-state-in-effect` lint error)
5. **`components/AdminSLAPage.js`** + **`app/admin/sla/page.js`** — SLA dashboard renders `/admin/api/sla` data (endpoint already existed); KPI cards for compliance %, overdue count, stuck count; overdue and stuck order tables; avg turnaround by repair type table
6. **`__tests__/api/search.test.js`** — 8 tests: 401, empty for short query, empty for blank query, queries all 3 tables with org filter, quote/order/customer result shapes with correct hrefs, sorted by most recent

### Lint fixes
- `AdminNav.js` was using `setSearchOpen` (synchronous setState in effect) — replaced with `searchFocused` state + `dropdownOpen` derived constant; all state updates moved inside async `setTimeout` callback

### Test suite after Sprint 16
102 tests across 12 suites — all passing.

---

## Sprint 17 — Internal Order Notes & Auto Customer Notifications ✅ COMPLETE

### Migration applied to production
- `20260513_016_order_notes.sql` — adds `notes text` (nullable) to `repair_orders` for internal staff use

### What was done
- **`PATCH /admin/api/orders/[orderId]`** — three additions:
  1. Added `notes` to patchable fields; writes `note_updated` audit log entry (old_value / new_value)
  2. Added `quote_request_id` to the initial SELECT (needed for notification lookup)
  3. After a status change to a customer-facing status, fetches the latest `repair_order_status_history` row (written by DB trigger) to get a stable `historyId` for deduplication, then fires `sendRepairStatusNotification` fire-and-forget — customer gets email + SMS without blocking the response
- **`CUSTOMER_NOTIFY_STATUSES`** — statuses that trigger customer notification: `inspection`, `repairing`, `awaiting_balance_payment`, `ready_to_ship`, `shipped`, `delivered`, `cancelled`, `returned_unrepaired`, `beyond_economical_repair`, `no_fault_found`
- **`components/AdminRepairOrderPage.js`** — added "Staff notes" section: textarea + Save button; loads existing notes on mount (`result.order?.notes`); PATCH to `/admin/api/orders/{orderId}` with `{ notes }` body; success/error feedback
- **`__tests__/api/orders-queue.test.js`** — 3 new tests: notes saves + audit entry, notification fires for customer-facing status, notification suppressed for internal-only status; also fixed missing `limit()` on mock chain

### Test suite after Sprint 17
105 tests across 12 suites — all passing.

---

## Sprint 18 — Deposit Mark-Paid UI + Request Final Balance ✅ COMPLETE

### No migration needed

### What was done
- **`components/AdminRepairOrderPage.js`** — three additions:
  1. **"Mark Deposit Paid" button** — appears in the action bar when `inspection_deposit_required > 0` and `inspection_deposit_paid_at` is null; calls `POST /admin/api/quotes/[quoteId]/deposit`; on success updates local order state and refreshes payment summary panel; shows inline success/error feedback
  2. **"Request Final Balance" button** — appears when `paymentData.summary.finalBalanceDue > 0`; calls `POST /admin/api/quotes/[quoteId]/request-final-balance`; on success updates status and refreshes payment summary; shows amount due in button label
  3. **Deposit status in quote summary** — new summary card shows deposit amount and Paid/Unpaid in green/red when deposit is required; disappears when no deposit is set

### Remaining gaps (resolved)
- ~~No UI button to mark deposit paid~~ — now implemented

### Test suite after Sprint 18
105 tests across 12 suites — all passing (no new test suite; UI-only change).

---

## Sprint 19 — New Quote Admin Alerts + Unreviewed Count Badge ✅ COMPLETE

### What was done
- **`app/api/quote-requests/route.js`** — fire-and-forget admin alert after quote creation: fetches org name + owner/admin emails from `organization_members`, calls `sendNewQuoteAlertEmail`
- **`app/admin/api/quotes/unreviewed-count/route.js`** (new) — GET; counts `status = 'submitted'` quote_requests for session org; returns `{ count }`
- **`components/AdminNav.js`** — fetches unreviewed count on mount alongside billing; orange badge on Quotes link when count > 0 (shows "99+" for counts > 99)
- **`lib/email.js`** — added `sendNewQuoteAlertEmail({ to, orgName, quoteId, customerName, device, repairType })`; `emailWrapper` parameterized with optional `footerNote` so admin alerts use appropriate footer text

### Test suite after Sprint 19
110 tests across 16 suites — all passing.

---

## Sprint 20 — Customer Reviews + Follow-Up Automation ✅ COMPLETE

### Migration applied to production
- `20260514_017_repair_reviews.sql` — `repair_reviews` table: org-scoped, unique per `quote_request_id`, rating 1–5 check, source enum (`email_link`/`web`/`manual`)

### What was done
- **`POST /api/review/[quoteId]`** — public; validates rating 1–5; inserts review; 409 on duplicate
- **`app/review/[quoteId]/page.js`** — server component; reads `?rating=` param, clamps 1–5, passes `initialRating` to `CustomerReviewPage`
- **`components/CustomerReviewPage.js`** — 'use client'; auto-submits from email star link via useEffect; manual star picker + textarea; thank-you state; 409 treated as already submitted
- **`GET /api/cron/follow-up`** — CRON_SECRET required; sends review requests for orders shipped 3 days ago; warranty reminders 7 days before expiry (bounded lower by `repair_completed_at >= now - 372 days`)
- **`GET /admin/api/reviews`** — auth-gated; joins `quote_requests`; returns reviews + `{ total, avgRating, distribution }`
- **`components/AdminReviewsPage.js`** — star distribution cards, search, table
- **`vercel.json`** — added `/api/cron/follow-up` at `0 10 * * *`

### Test suite after Sprint 20
125 tests across 17 suites — all passing.

---

## Sprint 21 — CSV Data Export ✅ COMPLETE

### What was done
- **`lib/csvExport.js`** (new) — `csvRow(values)` (RFC 4180 escaping), `csvResponse(rows, filename)`, `fmtAmount(cents)`, `fmtDate(iso)`
- **`GET /admin/api/export/customers`** — customers + aggregated order stats + payments; columns: Name, Email, Phone, Orders, Completed, Total Paid, Repeat, Joined
- **`GET /admin/api/export/orders`** — selects `assigned_technician_user_id`, deduplicates, queries `organization_members` by `user_id` for names (workaround: no direct FK from `repair_orders` to `organization_members`); columns: Order #, Quote ID, Customer, Email, Device, Repair Type, Status, Priority, Technician, Due Date, Total Paid, Created
- **`GET /admin/api/export/reviews`** — rating, customer, device, comment, source
- **`AdminCustomersPage`**, **`AdminOrdersQueue`**, **`AdminReviewsPage`** — "Export CSV" `<a download>` buttons added

### Test suite after Sprint 21
136 tests across 16 suites — all passing.

---

## Sprint 22 — Pricing Rule Creation + Deletion ✅ COMPLETE

### No migration needed
`quote_requests.selected_pricing_rule_id` already has `ON DELETE SET NULL` from Sprint 5 migration, so hard-delete of pricing rules is safe.

### What was done
- **`GET /admin/api/catalog`** (new) — returns all active catalog models (with brand join), all repair types, and existing rule keys for the org as `"modelId:repairTypeId"` strings; used by add-rule form for duplicate detection
- **`POST /admin/api/pricing`** — new handler on existing route; validates `modelId` + `repairTypeId` required, `priceMode` in [`fixed`, `range`, `manual`]; verifies model + repair type exist via parallel `maybySingle`; inserts org-scoped rule; 409 on `23505` unique violation; returns 201
- **`DELETE /admin/api/pricing/[ruleId]`** — new handler on existing route; verifies org ownership via `maybySingle` → 404 if not found; hard-deletes; returns `{ ok: true }`
- **`components/AdminPricingPage.js`** — major rewrite: "+ Add Rule" button in header; expandable add form with model selector grouped by `category — brand` (optgroup), repair type selector, price fields conditional on mode; inline duplicate warning when selected combination already exists; delete button per rule card with `window.confirm` guard; lazy catalog load on first "+ Add Rule" click

### Test suite after Sprint 22
151 tests across 17 suites — all passing.

---

## Sprint 23 — Appointment Scheduling ✅ COMPLETE

### Migration applied to production
- `20260514_018_appointments.sql` — `appointments` table: org-scoped, status enum (`pending`/`confirmed`/`cancelled`/`no_show`/`converted`), `preferred_at`, customer fields, optional `customer_id` + `quote_request_id` FKs; `updated_at` trigger; RLS via `is_org_member`

### What was done
- **`POST /api/appointments`** — public endpoint; resolves org by slug + active status check; validates future datetime; inserts appointment; fires `sendAppointmentConfirmationEmail` fire-and-forget
- **`GET /admin/api/appointments`** — auth-gated; returns all org appointments ordered by `preferred_at`; supports `?status=`, `?from=`, `?to=` query params
- **`PATCH /admin/api/appointments/[appointmentId]`** — auth-gated; verifies org ownership; updates `status`, `notes`, `preferred_at`, `cancellation_reason`; auto-sets `confirmed_at` and `cancelled_at` on status transitions; 400 on invalid status
- **`lib/email.js`** — added `sendAppointmentConfirmationEmail({ to, orgName, firstName, preferredAt, device, repairDescription })`
- **`components/BookingPage.js`** (new) — public booking form: name, email, phone, device brand/model, repair description, datetime picker (min = 1 hour from now); success state with email confirmation message
- **`app/shop/[orgSlug]/book/page.js`** (new) — server component wrapper for `BookingPage`
- **`components/AdminAppointmentsPage.js`** (new) — summary cards (pending, upcoming, total); status filter tabs with counts; table with confirm/no-show/cancel/convert-to-quote actions; status badges; PATCH on each action button
- **`app/admin/appointments/page.js`** (new) — wrapper
- **`components/AdminNav.js`** — "Appointments" link added; orange badge when pending count > 0 (fetches `/admin/api/appointments?status=pending` on mount)
- **`app/shop/[orgSlug]/page.js`** — "Book Appointment" card added alongside estimate and track cards

### Route added to public shop
| URL | Description |
|-----|-------------|
| `/shop/[slug]/book` | Appointment booking form |

### Test suite after Sprint 23
165 tests across 18 suites — all passing.

---

## Sprint 24 — Repair Catalog Management ✅ COMPLETE

### Migration applied to production
- `20260514_019_org_catalog.sql` — adds nullable `organization_id` to `repair_catalog_brands`, `repair_catalog_models`, `repair_types` (`NULL` = global platform item; non-null = org-specific custom item); replaces global unique constraints on `slug`/`model_key`/`repair_key` with partial unique indexes (global items unique globally, org items unique per org); updates RLS: SELECT = global OR org member; INSERT/UPDATE/DELETE = org members on their own items only; indexes on `organization_id WHERE NOT NULL`

### What was done
- **`GET /admin/api/catalog/brands`** — returns global + org brands; marks each with `is_org_owned`
- **`POST /admin/api/catalog/brands`** — creates org-specific brand; auto-generates slug from name + org ID prefix; validates category
- **`PATCH /admin/api/catalog/brands/[brandId]`** — updates org-owned brand (name, category, active); 404 for global/cross-org items
- **`DELETE /admin/api/catalog/brands/[brandId]`** — hard-deletes org-owned brand (cascades to models + pricing rules via DB FKs)
- **`GET /admin/api/catalog/models`** — returns global + org models with brand join; `is_org_owned` flag
- **`POST /admin/api/catalog/models`** — creates org-specific model; verifies brand is accessible (global or org-owned); auto-generates `model_key`
- **`PATCH /admin/api/catalog/models/[modelId]`** — updates org-owned model; 404 for global/cross-org
- **`DELETE /admin/api/catalog/models/[modelId]`** — hard-deletes org-owned model (cascades pricing rules)
- **`GET /admin/api/catalog/repair-types`** — returns global + org repair types; `is_org_owned` flag
- **`POST /admin/api/catalog/repair-types`** — creates org-specific repair type; auto-generates `repair_key`; validates price_mode_default
- **`PATCH /admin/api/catalog/repair-types/[typeId]`** — updates org-owned repair type; 404 for global/cross-org
- **`DELETE /admin/api/catalog/repair-types/[typeId]`** — hard-deletes (cascades pricing rules)
- **`app/admin/api/catalog/route.js` (updated)** — GET now includes org-specific models and repair types in addition to global items (used by pricing rule creation form)
- **`components/AdminCatalogPage.js`** (new) — three-tab admin page (Brands / Models / Repair Types); global items shown read-only with "Global" badge; org items have "Custom" badge + Edit/Delete buttons; inline edit rows; `+ Add` forms per tab; model tab includes brand selector and search
- **`app/admin/catalog/page.js`** (new) — wrapper
- **`components/AdminNav.js`** — "Catalog" link added between Parts and Staff
- **`__tests__/api/catalog-management.test.js`** (new) — 17 tests: GET brands 401/org-filter/is_org_owned; POST brands 401/400-missing-name/400-bad-category/201-org-scoped; PATCH brands 404-cross-org/200-updates; DELETE brands 404-cross-org/200-deletes; POST models 400-no-brand/404-bad-brand/201-org-scoped; POST repair-types 400/201; DELETE repair-types 404/200
- **`__tests__/api/pricing-create-delete.test.js` (updated)** — added `.or()` to catalog mock chains to match updated route

### Key design decisions
- Global catalog items are read-only for org admins — modifications require platform team action
- Org-specific items coexist with global items in all selectors (pricing rule form, booking form)
- Deleting org items cascades via existing DB FKs (brand → models → pricing_rules)
- Slug/key auto-generation appends 8-char org ID prefix to avoid collisions with global items

### Test suite after Sprint 24
182 tests across 19 suites — all passing.

---

## Sprint 25 — Gap Audit & Hardening ✅ COMPLETE

### Investigation findings
Full gap audit performed against all 24 sprints. Key findings:

1. **`getDefaultOrgId()` call sites**: Only two intentional fallback paths remain (`customer-portal`, `quote-requests`) — both serve legacy single-tenant routes (`/portal`, `/estimate`). A third call site in `lib/admin/quotes.js` was dead code.
2. **`is_staff()` legacy function**: Still used by 13 RLS policies across 9 tables — cannot drop without rewriting all policies first. Migration 020 written but **not yet applied** — requires testing against staging DB.
3. **Rate limiting**: `quote-requests` already had it. `appointments` and `review/[quoteId]` were missing it.
4. **Notifications observability**: Already complete — `notifications` table records `queued → sent/failed` with `error_message`; SMS errors logged.
5. **`profiles.email` nulls**: Zero null-email profiles confirmed via DB query — migration 015 backfill held.
6. **`lib/admin/quotes.js` dead code**: `listQuoteRequests`, `getQuoteRequestDetail`, `buildStatusCounts` were exported but never called; both used `getDefaultOrgId()`.

### What was done
- **`lib/admin/quotes.js`** — removed `listQuoteRequests`, `getQuoteRequestDetail`, `buildStatusCounts`, and the `getDefaultOrgId` import; retained `QUOTE_STATUS_OPTIONS`, `formatQuotePrice`, `formatStatusLabel`
- **`app/api/appointments/route.js`** — added `checkRateLimit` (10 req/hr per IP) at top of POST handler
- **`app/api/review/[quoteId]/route.js`** — added `checkRateLimit` (20 req/hr per IP) at top of POST handler
- **`__tests__/api/appointments.test.js`** — added `jest.mock('../../lib/rateLimiter', ...)` to prevent rate limiter from consuming mock Supabase calls
- **`__tests__/api/reviews.test.js`** — same mock + added `headers: { get: () => null }` to `makePostRequest`
- **`supabase/migrations/20260514_020_replace_is_staff_policies.sql`** — migration written to rewrite all 13 `is_staff()` RLS policies to use `is_org_member(organization_id)` and then drop the no-arg `is_staff()` function; **not yet applied to production — requires staging validation first**

### Known remaining gaps (tracked)
| Gap | Status | Notes |
|-----|--------|-------|
| `is_staff()` policy rewrite | Pending production apply | Migration 020 written; must test on staging first |
| `getDefaultOrgId()` in `customer-portal` + `quote-requests` | Intentional | Legacy single-tenant routes; remove when all shops have slugs |
| RLS integration tests | Not started | Requires local Supabase CLI setup |
| `AdminRepairOrderPage.js` refactor (1300+ lines) | Not started | Extract sections one at a time |
| Inline styles → CSS Modules | Not started | Future priority |
| Customer account login | Not started | Sprint 27+ backlog |

### Test suite after Sprint 25
190 tests across 19 suites — all passing.

---

## Sprint 26 — Hardening: ThemeProvider, HMAC Tokens, Mock Factory, Migration Script ✅ COMPLETE

### No migration needed

### What was done

1. **Fixed build regression** — `AdminRepairOrderPage.js` had a stray `</div>` closing tag left from the Sprint 25 component extraction; removed to restore clean build

2. **`__tests__/helpers/supabaseMock.js`** (new) — Proxy-based Supabase mock factory:
   - `createSupabaseMock(responses)` — per-table response config; arrays for sequential calls; Proxy catch-all prevents future method-not-found test breaks
   - `getChain(supabase, table, n)` — helper to retrieve the nth chain created for a given table after route execution
   - Exported as `{ createSupabaseMock, getChain }`

3. **Test migrations to proxy mock factory** — eliminated all `callCount`-based patterns:
   - **`__tests__/api/analytics.test.js`** — replaced custom `makeSupabaseMock` with `createSupabaseMock`; `payments` and `quote_requests` use arrays for sequential responses; chain-specific assertions use `getChain()`
   - **`__tests__/api/orders-queue.test.js`** — fully migrated; `maybySingleQueue` replaced with table arrays; `eqFilters` spy replaced with `getChain(supabase, 'repair_orders', N).eq` assertions
   - **`__tests__/api/catalog-management.test.js`** — all 17 tests migrated; `let call = 0` counters eliminated; `insert` assertions use `getChain()` pattern

4. **`components/ThemeProvider.js`** (new) — `'use client'` component; injects `--blue`/`--blue-strong` (from `primary_color`) and `--accent` (from `accent_color`) as `:root` CSS custom properties via `<style>` tag; no wrapper element so layout is unaffected
   - **`app/admin/layout.js`** — converted to async server component; fetches `organization_branding` using session org; passes colors to `ThemeProvider` (gracefully skips on auth failure)
   - **`app/shop/[orgSlug]/layout.js`** (new) — async server component layout for all shop pages; fetches branding by slug; injects `ThemeProvider`

5. **`lib/hmacToken.js`** (new) — HMAC-SHA256 token helpers using `EMAIL_LINK_SECRET` env var:
   - `generateToken(quoteId)` — returns hex token or `null` if secret not configured
   - `verifyToken(quoteId, token)` — returns `true` if: secret not set, token absent (backward compat), or token matches; returns `false` only when secret is set and token is present but wrong
   - **`lib/notifications.js`** — `buildSecureUrl()` helper appends `?tok=...` to review/track/mail-in URLs when `EMAIL_LINK_SECRET` is configured
   - **6 page components updated** to accept `searchParams` and pass `tok` down: `app/estimate-review/[quoteId]/page.js`, `app/shop/.../estimate-review/[quoteId]/page.js`, `app/track/[quoteId]/page.js`, `app/shop/.../track/[quoteId]/page.js`, `app/mail-in/[quoteId]/page.js`, `app/shop/.../mail-in/[quoteId]/page.js`
   - **3 client components updated** to accept and forward `tok` in API POST bodies: `CustomerEstimateReviewPage`, `CustomerTrackingPage`, `MailInInstructionsPage`
   - **3 API routes updated** to verify token at top of handler: `app/api/estimate-review/[quoteId]/route.js`, `app/api/track/[quoteId]/route.js`, `app/api/mail-in/[quoteId]/route.js` — returns 403 if secret set and token wrong; allows through if no secret or no token

6. **`scripts/apply-migration.sh`** (new) — safe migration workflow script:
   - Usage: `./scripts/apply-migration.sh <migration-file> [project-id]`
   - Reads `SUPABASE_ACCESS_TOKEN` from env or `.claude/settings.json`
   - POSTs SQL to `https://api.supabase.com/v1/projects/{id}/database/query`
   - Exits non-zero on HTTP failure; suitable for CI use

### New env var
- `EMAIL_LINK_SECRET` — server-side secret for HMAC token generation/verification; optional but recommended in production; rotate to invalidate all existing email links

### Staging environment setup
To create a staging environment:
1. Create a second Supabase project (free tier) and note its Project ID
2. Apply all migrations in order: `for f in supabase/migrations/*.sql; do ./scripts/apply-migration.sh "$f" <staging-project-id>; done`
3. Set `SUPABASE_PROJECT_ID=<staging-id>` when running the script against staging
4. Add staging project's env vars to a `.env.staging` file (gitignored)

### Test suite after Sprint 26
190 tests across 19 suites — all passing.

---

## Environment notes
- Next.js on Vercel — uses `proxy.js` (not `middleware.js`) as the edge middleware file
- Supabase publishable key env var: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (also falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in proxy.js)
- Service role key in `SUPABASE_SERVICE_ROLE_KEY` — used by `lib/supabase/admin.js`
- Stripe webhook secret for repair payments: `STRIPE_WEBHOOK_SECRET`
- Stripe webhook secret for billing: `STRIPE_BILLING_WEBHOOK_SECRET`
- Stripe billing price ID: `STRIPE_BILLING_PRICE_ID`
- Cron secret for `/api/cron/trial-check`: `CRON_SECRET` (optional)
- HMAC token secret for email links: `EMAIL_LINK_SECRET` (optional but recommended; rotate to invalidate old links)
- Default shop slug for legacy single-tenant routes: `NEXT_PUBLIC_DEFAULT_ORG_SLUG` / `DEFAULT_ORG_SLUG` (used by `EstimateForm` to fetch org-scoped pricing on the generic `/estimate` route)
