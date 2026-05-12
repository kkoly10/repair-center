# repair-center — Product Roadmap

Last updated: 2026-05-12. Update this file when sprints complete or priorities shift.

---

## What's built ✅

### Customer flows (end-to-end)
- Instant estimator — model + repair type → immediate price display
- Full estimate form — device, brand, model, repair, condition questions, photo upload (up to 6)
- Estimate review — approve or decline preliminary estimate
- Deposit payment — Stripe PaymentIntent, webhook, deduplication
- Mail-in instructions — packing checklist, shipping address, per-org config
- Repair tracking — quote ID + email verification → status, messages, shipments
- Final balance payment — Stripe, webhook, deduplication
- Customer notifications — email (Resend) + SMS (Twilio): estimate, deposit, status, shipment, final balance
- Promo codes — WELCOME10, RETURN15, SAVE20, FREESHIP + returning-customer auto-discount (10%)
- Service add-ons — data backup ($39), express service ($49), screen protector ($19)
- Warranty tiers — 90 / 180 / 365-day options
- White-label shop URL — `/shop/[orgSlug]/estimate`

### Admin panel
- Quote queue — filterable (status, search), paginated, photo count
- Estimate builder — line items: labor, parts, shipping, discounts, credits
- Revised estimates — if customer declines initial estimate
- Repair order management — status machine, technician assignment
- Device intake report — condition, damage, included items, IMEI/serial
- Payment tracking — deposit + final balance reconciliation
- Analytics dashboard — revenue (30/60-day), quote funnel, device popularity, turnaround compliance
- SLA monitoring — overdue orders, turnaround time compliance
- Team management — invite staff, assign roles (owner / admin / tech / viewer)
- Organization settings — name, slug, support contact, mail-in address
- Organization branding — logo, primary color, accent color, hero text
- Payment config — manual instructions, Stripe platform, Stripe Connect, CashApp, Zelle, Square URL

### Multi-tenancy
- Full org isolation — `organization_id` on every table, RLS + app-level scoping
- Session-based org resolution — `getSessionOrgId()` in all admin routes
- Team roles + permissions — owner / admin / tech / viewer with enforced access
- Team invitations — token-based, 7-day expiry, auto-accept flow
- Self-serve signup + onboarding — new org seeds members, settings, branding, payment tables
- Per-org pricing rules — org-scoped; public RLS removed (Sprint 3c)

### Technical foundation
- Rate limiting — 5 submissions/hr per IP on public quote endpoint
- Photo storage — Supabase Storage, org-scoped paths
- Notification deduplication — by event key
- Status history — trigger-based audit log on repair_orders
- Stripe webhooks — `payment_intent.succeeded` for both deposit and final balance
- Public pricing API — `GET /api/pricing/[shopSlug]` (org-scoped, replaces removed RLS policy)

---

## What's partial 🟡

| Area | Exists | Missing |
|---|---|---|
| Customer portal (`/my-repairs`) | Login shell, page structure | Order history list, account settings, saved addresses |
| Staff messaging | Schema + API (`/admin/api/quotes/[quoteId]/messages`) | Unread counts, real-time UI in admin panel |
| Device intake report | Schema + API | Admin form UI (photo capture, condition fields) |
| Refund flow | `refund` payment_kind in payments schema | Admin UI to issue refund, Stripe refund API call |
| Pricing rules | Full DB schema, org-scoped API | Admin editor UI — currently requires direct DB access |
| Repair catalog | Full schema + static `lib/repairCatalog.js` | Admin editor — new orgs can't add device models without code change |
| Forgot password | Supabase auth infrastructure | Reset flow not wired in UI |
| Automated follow-ups | `followUpEmails.js` module | Not triggered anywhere — no scheduler |

---

## What's missing ❌

### Tier 1 — Blocks growth (build next)

#### Walk-in / POS ticket flow
Mall kiosks take walk-ins far more than mail-in. The entire current flow assumes mail-in.
- Counter check-in mode: create ticket in < 60 seconds, no estimate step required
- `submission_source = 'walk_in'` path in quote_requests (or a separate `walk_in_tickets` table)
- Collect deposit at counter (cash or Stripe Terminal / manual)
- Print receipt / work order label
- Status flow: `checked_in → diagnosed → parts_ordered → repairing → ready → picked_up`

#### Parts inventory management
The #1 operational request from shops. Nothing exists today.
- `parts` table — SKU, name, category, supplier, cost, retail price
- `part_stock` table — quantity on hand, reorder threshold, location (for multi-location)
- Parts-to-ticket linkage — when tech marks a part used, stock decrements automatically
- Low-stock alerts — notification when quantity falls below threshold
- Purchase orders — log incoming stock from supplier
- Inventory dashboard in admin

#### Admin pricing rules UI
New shops can't set their own pricing without direct DB access.
- CRUD for pricing_rules per org (model + repair type → price, deposit, turnaround)
- Condition-based adjustments (e.g., +$20 if liquid damage)
- Bulk import from CSV

#### Repair catalog editor
`lib/repairCatalog.js` is hardcoded. New orgs are stuck with the default device list.
- Admin UI to add / edit brands, models, repair types per org
- Or: shared global catalog with org-level overrides

#### SaaS subscription billing
`plan_key` exists on `organizations` but nothing enforces it.
- Stripe subscription per org (monthly / annual)
- Plan tiers: Starter (1 location, 2 staff), Pro (3 locations, 10 staff), Enterprise (unlimited)
- Feature gates tied to `plan_key` — e.g., analytics locked to Pro+
- Trial period enforcement (`trial_ends_at` column already exists)
- Billing portal for org owners

### Tier 2 — Ops quality

#### Shipping label generation
Schema has carrier / tracking_number / tracking_url but no label creation.
- Integrate EasyPost or ShipStation
- Admin can buy and print return label from repair order page
- Tracking auto-populated from label

#### Automated follow-up sequences
`followUpEmails.js` exists but is never triggered.
- "Quote hasn't been approved in 3 days" — send reminder email
- "Repair completed 7 days ago, no pickup" — check-in message
- Cron job or Supabase Edge Function scheduler

#### Refund UI
Payment schema supports `payment_kind = 'refund'` but no admin path to issue one.
- Admin button on payment page → call Stripe refund API → insert refund payment row
- Partial vs full refund support

#### Customer portal completion
`/my-repairs` is a shell.
- Order history list (quote ID, device, status, date)
- Per-order detail view (messages, status history, payments)
- Account settings (name, phone, preferred contact)

#### Warranty claims
`warranty_days` is set per order but no claim flow exists.
- Customer submits warranty claim via tracking page (links back to original order)
- Admin sees warranty flag on incoming quote — auto-links to previous order

### Tier 3 — Scale / polish

| Feature | Notes |
|---|---|
| Feature gating by plan | Required before charging orgs at different tiers |
| CSV export | Quote list, payment list, analytics data |
| Custom report builder | Date range, filter by status / device / tech |
| Accounting sync | QuickBooks / Xero — push invoices and payments |
| Multi-currency | Schema has `currency` field; UI assumes USD |
| Audit log | Who sent which estimate, changed which status — admin-only view |
| Technician time tracking | Log labor time per ticket for payroll and margin analysis |
| Margin analysis | Cost vs revenue per repair type — needs parts cost data |
| Appointment scheduling | Calendar booking for walk-in drop-off slots |
| Forgot password UI | Wire Supabase resetPasswordForEmail |
| MFA | TOTP for admin accounts |
| Mobile responsiveness audit | Styled but not formally tested at all breakpoints |
| Dark mode | Not implemented |
| GDPR data export | User data export + account deletion workflow |
| Tax rate configuration | `tax_amount` on estimates but no rate config per org |
| Shipping insurance | `insured_value` column exists on shipments — no UI |
| Bulk status updates | Admin can only update one order at a time |
| Slack / webhook notifications | Staff alerts for new quotes, messages |

---

## Sprint roadmap

### Sprint 4 — Walk-in POS + Parts inventory
**Goal**: make the product usable for mall kiosks (highest-value market segment)

- [ ] Walk-in ticket creation — counter check-in, instant ticket, no estimate step
- [ ] Walk-in status flow — `checked_in → diagnosed → repairing → ready → picked_up`
- [ ] Parts inventory schema — `parts`, `part_stock`, `inventory_transactions` tables
- [ ] Parts admin UI — add/edit parts, set stock levels, reorder threshold
- [ ] Parts-to-ticket linkage — tech assigns parts to repair order, stock auto-decrements
- [ ] Low-stock alerts — email/notification when stock hits threshold

### Sprint 5 — Admin catalog + pricing editor
**Goal**: allow any new org to configure their own devices and prices without code changes

- [ ] Repair catalog admin UI — add brands, models, repair types per org
- [ ] Pricing rules editor — create/edit rules (price, deposit, turnaround) per model + repair
- [ ] Condition-based price adjustments UI
- [ ] Decouple `lib/repairCatalog.js` from frontend — load from DB for orgs that have catalog data; fall back to static for legacy

### Sprint 6 — SaaS billing
**Goal**: charge multiple orgs on recurring plans

- [ ] Stripe subscription flow — org owner subscribes to a plan on signup or from billing page
- [ ] Plan tiers defined — Starter / Pro / Enterprise with limits
- [ ] Feature gates — enforce plan limits in API routes and admin UI
- [ ] Trial enforcement — block access after `trial_ends_at` with upgrade prompt
- [ ] Billing portal page — view invoice history, change plan, update card

### Sprint 7 — Fulfillment ops
**Goal**: close the remaining operational gaps that staff hit daily

- [ ] Shipping label integration (EasyPost or ShipStation)
- [ ] Refund UI — admin-initiated, Stripe API + payment row
- [ ] Automated follow-up sequences — cron/scheduler for stale quotes
- [ ] Customer portal — finish `/my-repairs` (order history, account settings)
- [ ] Warranty claim flow — customer submits claim, auto-links to original order
- [ ] Forgot password UI

---

## Database tables (current)

### Org / auth
`organizations`, `organization_members`, `organization_invitations`, `organization_settings`, `organization_branding`, `organization_payment_settings`

### Customers
`customers`, `customer_addresses`

### Catalog (static reference)
`repair_catalog_brands`, `repair_catalog_models`, `repair_types`, `pricing_rules`, `pricing_rule_conditions`

### Quote → estimate flow
`quote_requests`, `quote_request_photos`, `quote_estimates`, `quote_estimate_items`

### Repair → fulfillment
`repair_orders`, `device_intake_reports`, `repair_order_status_history`, `repair_messages`

### Payments + shipping
`payments`, `shipments`

### Support
`notifications`, `rate_limits`

### Not yet created (Sprint 4+)
`parts`, `part_stock`, `inventory_transactions`, `purchase_orders`, `warranty_claims`, `subscriptions`, `plan_features`

---

## Key constraints (don't forget)

- **No inventory until Sprint 4** — keep current PRs clean
- **No Stripe Connect wiring yet** — config exists but don't build the Connect onboarding flow
- **No subdomain routing** — slug-based org routing only (`/shop/[orgSlug]/`)
- `getDefaultOrgId()` is intentional fallback during single-tenant transition — remove when all orgs have slugs
- Supabase MCP is authenticated to a different account — apply migrations via Management API (curl to `POST https://api.supabase.com/v1/projects/bpchjjgilooaztqipdkt/database/query`) with PAT in `.claude/settings.json`
