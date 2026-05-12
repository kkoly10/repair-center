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
| Repair order workflow (intake, inspection, repair, return) | **In beta** |
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
| Repair queue + status workflow | **In beta** |
| SLA tracking (repair time targets) | **In beta** |
| Basic repair analytics (volume, revenue) | **Coming soon** |
| Customer history (repeat customers) | **Coming soon** |
| Invoices / receipts (PDF) | **Coming soon** |
| Inventory & parts | **Not included — Pro+** |
| Staff performance reports | **Not included — Pro+** |
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
| Customer history + lifetime value | **Coming soon** |
| Invoices / receipts (PDF) | **Coming soon** |
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

### Phase 2 — Repair Queue & Workflow ⚙️ In Beta
- Repair order status workflow (submitted → inspected → repairing → shipped)
- Intake form, device condition photos
- Technician assignment
- SLA tracking

### Phase 3 — Staff & Team Management 🔜 Coming Soon
- Staff roles (owner, admin, technician)
- Per-staff repair assignment views
- Activity log / audit trail
- Staff performance metrics

### Phase 4 — Inventory & Parts 🔜 Coming Soon
- Parts catalog (name, SKU, cost, quantity)
- Parts consumed per repair order
- Low-stock alerts
- Supplier / vendor records

### Phase 5 — Invoices, Receipts & Customer History 🔜 Coming Soon
- PDF invoice generation
- Printable / emailable receipts
- Customer profile: full repair + payment history
- Repeat customer detection

### Phase 6 — Reporting & Analytics 🔜 Coming Soon
- Revenue by date range, repair type, technician
- Average repair time
- Deposit vs. balance collection rates
- Churn / repeat rate

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

**Current status: targeting 8.5 (controlled beta).** Sprints 1–7 complete. Phase 1 is done; Phase 2 is in beta.
