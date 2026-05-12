# Repair Center — Product Roadmap & Pricing Tiers

## Product Positioning

Repair Center is a SaaS platform for repair shops to accept online quote requests, convert to instant repair orders, manage mail-in workflows, provide live customer tracking, and (later) run full shop operations from a single dashboard.

The near-term focus is helping shops get online fast with zero friction: a customer-facing estimate form, automated notifications, and an admin workflow that replaces DMs and spreadsheets. Inventory, POS, and Stripe Connect are intentionally deferred to keep the core experience tight.

---

## Target Customers

| Tier | Who |
|------|-----|
| **Starter** | Solo technicians, mobile repair, social-media-only shops who need a professional online presence and quote intake |
| **Growth** | Small repair shops and mall kiosks with 1–5 staff who need a shared queue and basic workflow |
| **Pro** | Serious shops needing inventory tracking, staff management, and operational reports |
| **Advanced** | Multi-location operations, high-volume shops, or franchises needing location management, POS, and custom domains |

---

## Pricing Tiers

| Tier | Public Price | Founder Price |
|------|-------------|---------------|
| **Starter Portal** | $29 / mo | $25 / mo |
| **Growth Shop** | $59 / mo | $49 / mo |
| **Pro Operations** | $99 / mo | $79 / mo |
| **Advanced** | $149+ / mo | Custom |

Founder pricing is locked in for life for shops that sign up during controlled beta.

---

## Feature Matrix by Tier

### Starter Portal — $29/mo

| Feature | Status |
|---------|--------|
| Public estimate form (shop URL) | **Available now** |
| Quote request intake + admin dashboard | **Available now** |
| Email + SMS notifications to customer | **Available now** |
| Estimate builder (send / revise estimates) | **Available now** |
| Estimate approval + mail-in instructions | **Available now** |
| Live customer tracking page | **Available now** |
| Manual payment collection (CashApp, Zelle, Square link) | **Available now** |
| Stripe payment links (deposit + final balance) | **Available now** |
| Admin settings (branding, receiving address) | **Available now** |
| Pricing catalog (per-model, per-repair rules) | **Available now** |
| 1 staff seat (owner only) | **Available now** |
| Invite-based team signup | **In beta** |
| Repair order workflow (intake, inspection, repair, return) | **Available now** |
| Multi-staff seats | **Not included — Growth+** |
| Inventory & parts | **Not included — Pro+** |
| Reporting / analytics | **Not included — Pro+** |
| Multi-location | **Not included — Advanced** |
| Custom domain | **Not included — Advanced** |

---

### Growth Shop — $59/mo

Includes everything in Starter, plus:

| Feature | Status |
|---------|--------|
| Up to 5 staff seats | **Available now** |
| Team management (invite, role, remove) | **Available now** |
| Repair queue + status workflow | **Available now** |
| SLA tracking (due date / overdue view) | **Available now** |
| Basic repair analytics (volume, revenue) | **Available now** |
| Staff performance dashboard | **Available now** |
| Customer history (repeat customers) | **Available now** |
| Invoices / receipts (PDF) | **Available now** |
| Inventory & parts | **Not included — Pro+** |
| Staff performance reports | **Available now** |
| Multi-location | **Not included — Advanced** |
| Custom domain | **Not included — Advanced** |

---

### Pro Operations — $99/mo

Includes everything in Growth, plus:

| Feature | Status |
|---------|--------|
| Unlimited staff seats | **Available now** |
| Inventory & parts tracking | **Coming soon** |
| Parts used per repair (cost tracking) | **Coming soon** |
| Staff performance reports | **Coming soon** |
| Advanced revenue / margin reports | **Coming soon** |
| Customer history + lifetime value | **Available now** |
| Invoices / receipts (PDF) | **Available now** |
| Priority support | **Coming soon** |
| Multi-location | **Not included — Advanced** |
| Stripe Connect (marketplace payouts) | **Not included — Advanced** |
| Custom domain | **Not included — Advanced** |
| POS / barcode scanning | **Not included — Advanced** |

---

### Advanced — $149+/mo or custom

Includes everything in Pro, plus:

| Feature | Status |
|---------|--------|
| Multiple shop locations under one account | **Coming soon** |
| Per-location pricing rules + staff | **Coming soon** |
| Custom domain (yourbrand.com) | **Coming soon** |
| Stripe Connect (direct payouts to shop) | **Coming soon** |
| POS mode (in-store, walk-in) | **Coming soon** |
| Barcode / QR scanning | **Coming soon** |
| Purchase orders (parts ordering) | **Coming soon** |
| Franchise / white-label options | **Coming soon** |
| Dedicated onboarding + SLA support | **Coming soon** |

---

## Feature Roadmap by Phase

### Phase 1 — Online Quote & Order Portal ✅ Complete
- Public shop URL + estimate form
- Quote intake, admin review, estimate builder
- Estimate approval, mail-in workflow
- Customer tracking + messaging
- Manual + Stripe payment modes
- Admin settings, pricing catalog, team invites

### Phase 2 — Repair Queue & Workflow ✅ Complete (Sprint 8)
- `/admin/orders` queue: all active repair orders in one view
- Status, priority, technician, due date — all editable inline from the queue
- Filters: active / waiting parts / awaiting payment / overdue / completed / all
- Search by order #, quote ID, customer name/email
- Tech filter dropdown (per-org member list)
- `priority` (low/normal/high/urgent) and `due_at` columns on repair_orders
- `repair_order_audit_log` table: tracks technician assignment, priority, and due date changes
- `GET /admin/api/orders` + `PATCH /admin/api/orders/[orderId]` — both org-scoped
- `getSessionContext()` helper returns `{ orgId, userId }` for audit attribution
- Status changes from queue still feed the existing `repair_order_status_history` trigger
- Intake form, device condition photos (existing, per-quote repair order page)
- SLA tracking (due_at overdue view is the first SLA indicator)

### Phase 3 — Staff & Team Management ✅ Complete (Sprint 9)
- Staff roles (owner, admin, technician) — done in Sprint 3b
- Per-staff repair assignment views — `/admin/orders?tech={id}` filter in repair queue
- Activity log / audit trail — unified timeline on repair order page (status history + audit log merged)
- Staff performance metrics — `/admin/staff`: active orders, completed in 30d, avg turnaround per tech

### Phase 4 — Inventory & Parts 🔜 Coming Soon
- Parts catalog (name, SKU, cost, quantity)
- Parts consumed per repair order
- Low-stock alerts
- Supplier / vendor records

### Phase 5 — Invoices, Receipts & Customer History ✅ Complete (Sprint 10)
- Printable HTML invoice page (`/admin/quotes/[id]/invoice`) with browser print-to-PDF
- Email receipt via Resend (`POST /admin/api/quotes/[id]/send-invoice`) — "Send Receipt" button on repair order page
- Customer list page (`/admin/customers`) — order count, completed count, last order date, repeat badge
- Customer profile page (`/admin/customers/[id]`) — full repair history, lifetime value, repeat customer flag
- `GET /admin/api/customers` + `GET /admin/api/customers/[customerId]` — both org-scoped

### Phase 6 — Reporting & Analytics ✅ Complete (Sprint 11)
- Revenue by date range (7d / 30d / 90d / 12m / all) with previous-period trend
- Revenue by repair type and by technician (bar charts)
- Average repair time (intake → shipped)
- Deposit vs. balance collection rates
- Repeat customer rate

### Phase 7 — Stripe Connect 🔜 Deferred
- Direct payouts to shop Stripe accounts
- Platform fee collection
- Multi-shop payout dashboard

### Phase 8 — SaaS Subscription Billing 🔜 Deferred
- In-app plan selection and upgrade
- Stripe Billing integration (metered seats)
- Trial periods, coupons
- Dunning / failed payment handling

### Phase 9 — Multi-Location, POS & Advanced Ops 🔜 Deferred
- Multiple locations under one org
- POS / walk-in mode
- Barcode and QR scanning for devices and parts
- Purchase orders and supplier management
- Custom domain mapping

---

## Feature Gating Summary

| Capability | Starter | Growth | Pro | Advanced |
|-----------|---------|--------|-----|----------|
| Online quote portal | ✓ | ✓ | ✓ | ✓ |
| Stripe payments | ✓ | ✓ | ✓ | ✓ |
| Manual payment modes | ✓ | ✓ | ✓ | ✓ |
| Pricing catalog | ✓ | ✓ | ✓ | ✓ |
| Staff seats | 1 | up to 5 | Unlimited | Unlimited |
| Team management | — | ✓ | ✓ | ✓ |
| Repair queue / workflow | — | ✓ | ✓ | ✓ |
| Inventory & parts | — | — | ✓ | ✓ |
| Staff reports | — | — | ✓ | ✓ |
| Revenue / margin reporting | — | — | ✓ | ✓ |
| Multi-location | — | — | — | ✓ |
| Custom domain | — | — | — | ✓ |
| POS / barcode | — | — | — | ✓ |
| Stripe Connect | — | — | — | ✓ |
| Purchase orders | — | — | — | ✓ |

> Feature gating is not yet enforced in the codebase. All shops currently operate as single-org with full access. Enforcement will be added in Phase 8 alongside subscription billing.

---

## Product Readiness Targets

| Score | Milestone | What it means |
|-------|-----------|---------------|
| **8.5 / 10** | Controlled beta | Portal is usable end-to-end with trusted friend/beta shops. Core quote → approval → mail-in → payment flow works reliably. All critical multi-tenant data isolation verified. |
| **9.0 / 10** | Strong shop workflow | Repair queue, technician assignment, SLA tracking, and customer history working. Growth tier shops can manage their day from the dashboard. |
| **9.3 / 10** | Bigger shop operations | Inventory, parts tracking, PDF invoices, staff reports, and advanced analytics in place. Pro tier shops have meaningful operational control. |
| **9.5 / 10** | Competitor-close SaaS | Subscription billing live, Stripe Connect available, multi-location support usable. Positioned to compete directly with RepairDesk, RepairShopr, and similar platforms. |

**Current status: 9.3 reached (bigger shop operations).** Sprints 1–11 complete. Phases 1–3, 5, and 6 done. Phase 4 (inventory) deferred. Next target: 9.5 (competitor-close SaaS) — subscription billing, Stripe Connect, multi-location.
