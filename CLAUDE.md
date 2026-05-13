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

### Migration applied to production
- `20260512_010_inventory.sql` — `suppliers`, `parts`, `repair_order_parts` tables with org-scoped RLS (`is_staff(organization_id)` FOR ALL)

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

## Environment notes
- Next.js on Vercel — uses `proxy.js` (not `middleware.js`) as the edge middleware file
- Supabase publishable key env var: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (also falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in proxy.js)
- Service role key in `SUPABASE_SERVICE_ROLE_KEY` — used by `lib/supabase/admin.js`
- Stripe webhook secret in `STRIPE_WEBHOOK_SECRET`
