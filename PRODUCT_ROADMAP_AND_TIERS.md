# Repair Center — Product Roadmap & Pricing Tiers

## Product Positioning

Repair Center is a multi-tenant SaaS platform for independent repair shops. Each shop gets a branded public page, a customer-facing estimate form, mail-in and in-store workflows, customer tracking, payment collection, a parts inventory, a repair queue, basic analytics, review collection, appointment booking, and a CSV data export. The platform runs the software. The repair work is done by the shop.

The near-term focus is helping shops get online fast with zero friction. Stripe Connect, multi-location, and POS are intentionally deferred to keep the core experience tight.

---

## Current Pricing — Founder Beta

While the product matures we are running a single Founder Beta plan:

| Plan | Price | What's included |
|------|-------|-----------------|
| **Founder Beta Plan** | **$29 / month** | Every feature currently in the product. 14-day free trial. No credit card required during the trial. |

Founder Beta terms:

- Founder Beta is offered while we collect feedback and stabilize the platform.
- Existing founder accounts may receive grandfathered pricing or terms at the operator's discretion when public tiers launch — this is a goodwill decision, not a contractual promise.
- We will give beta customers reasonable notice before any pricing change.
- Trial does not auto-charge unless a payment method is added. Cancel anytime from the Stripe Customer Portal via `/admin/billing`.

---

## Long-term Pricing Tiers (planned, not yet launched)

When we exit beta and launch public tiers, the model is expected to be:

| Tier | Indicative price | Who it's for |
|------|------------------|--------------|
| **Starter** | $29 / mo | Solo techs, mobile, social-only shops who need an online presence and quote intake |
| **Growth** | $59 / mo | Small shops and kiosks (1–5 staff) needing a shared queue and basic workflow |
| **Pro** | $99 / mo | Shops needing inventory, reporting, and staff performance |
| **Advanced** | $149+ / mo or custom | Multi-location, high-volume, franchise, or white-label needs |

Tiered feature gating is **not yet enforced in code**. All Founder Beta accounts get every feature in the product today.

---

## Currently Available Features (what the product actually does today)

These features are live and tested in the Founder Beta. Each one will be assigned to a future tier when public tiers launch.

### Shop public pages (any shop, free for the customer)
- Branded shop landing page at `/shop/[slug]`
- Public estimate request form with photo upload
- Public appointment booking form
- Public customer tracking page (lookup by Quote ID + email)
- Customer login via email magic link to view all repairs for that shop (Sprint 28)

### Admin core
- Repair queue with status, priority, technician, due date inline editing
- Quote review and estimate builder (send estimate, revise estimate)
- Repair order page with intake, parts used, staff notes, status history + audit log
- Customer list and customer profile (lifetime value, repeat flag)
- Invoice page (HTML, printable) and emailed receipts
- Global search bar across quotes / orders / customers
- SLA dashboard (overdue / stuck / avg turnaround)
- Analytics dashboard (revenue, repair-type mix, technician mix, repeat rate, with previous-period comparison)
- Staff performance page
- Team management (invite, role, remove)
- Org settings (branding, receiving address, payment mode, manual payment instructions)

### Inventory & parts
- Parts catalog with low-stock alerts
- Per-repair-order parts tracking
- Supplier list

### Catalog management
- Per-shop custom brands, models, and repair types (alongside global catalog)
- Pricing rules editor (fixed / range / manual)

### Reviews
- Public review submission page
- Star-link in review-request email
- Admin reviews summary with star distribution
- Daily cron sends review requests 3 days after shipment and warranty reminders 7 days before expiry

### Appointments
- Public booking form
- Admin appointments page with status workflow (pending / confirmed / cancelled / no-show / converted)

### CSV export
- Customers, orders, and reviews exports

### Billing
- Subscription billing via Stripe (Stripe Checkout + Customer Portal)
- 14-day free trial
- Trial expiry warning emails (3-day and 1-day) via daily cron
- Suspended-account redirect
- Past-due flag

### Multi-tenant security
- Org-scoped RLS across all tables
- Session-based org resolution in every admin route
- HMAC-signed customer email links (when `EMAIL_LINK_SECRET` is set)
- Rate limiting on public quote, appointment, and review endpoints

---

## Long-term Feature Gating (planned)

This is the **intended** allocation of features to tiers once public tiers launch. Not enforced today.

| Capability | Starter | Growth | Pro | Advanced |
|------------|---------|--------|-----|----------|
| Public shop page + estimate form | ✓ | ✓ | ✓ | ✓ |
| Customer tracking + messaging | ✓ | ✓ | ✓ | ✓ |
| Manual payment modes | ✓ | ✓ | ✓ | ✓ |
| Stripe payment links | ✓ | ✓ | ✓ | ✓ |
| Pricing catalog | ✓ | ✓ | ✓ | ✓ |
| Appointments | ✓ | ✓ | ✓ | ✓ |
| Staff seats | 1 | up to 5 | unlimited | unlimited |
| Team management | — | ✓ | ✓ | ✓ |
| Repair queue / workflow | — | ✓ | ✓ | ✓ |
| Invoices / receipts | — | ✓ | ✓ | ✓ |
| Inventory & parts | — | — | ✓ | ✓ |
| Reporting / analytics | — | — | ✓ | ✓ |
| Staff performance reports | — | — | ✓ | ✓ |
| Custom catalog (brands/models/repair types) | — | — | ✓ | ✓ |
| Multi-location | — | — | — | ✓ |
| Custom domain | — | — | — | ✓ |
| POS / barcode | — | — | — | ✓ |
| Stripe Connect (marketplace payouts) | — | — | — | ✓ |
| Purchase orders | — | — | — | ✓ |

---

## What is *not* in the product yet

These are real gaps. Do not advertise them as available.

- **Stripe Connect** — shops connect their own Stripe accounts today, or use manual payment modes. Platform-level payout/marketplace flow is deferred.
- **Multi-location** — one organization is one shop today.
- **Custom domain mapping** — shops live at `/shop/[slug]` only.
- **POS / barcode scanning** — not built.
- **Purchase orders** — supplier list exists, but ordering parts and tracking POs is not built.
- **White-label / franchise** — not built.
- **Mobile app** — there is no native app; the web is responsive.

---

## Phase history (for engineering reference)

Sprints 1–28 covered: database multi-tenant foundation, application code conversion, session-based org resolution, customer-facing tenant behavior, payment settings + admin pricing + photo hardening, testing/CI, repair queue, staff performance, invoices + customer history, analytics, inventory & parts, hardening, subscription billing, billing enforcement + admin nav, global search + SLA dashboard, internal notes + auto customer notifications, deposit + final balance UX, new-quote admin alerts, customer reviews + follow-up automation, CSV export, pricing rule creation + deletion, appointment scheduling, repair catalog management, gap audit + hardening, ThemeProvider + HMAC tokens, /for-shops marketing page, customer magic-link account.

See `CLAUDE.md` for full sprint-by-sprint detail.

---

## Readiness for public beta

Engineering scope is essentially complete. The remaining blockers to public beta are:

1. **Legal / compliance documents reviewed by an attorney** (this is the current sprint).
2. **Live test of Stripe billing webhook against the actual price ID and webhook secret.**
3. **Two-shop isolation test** in a clean staging environment.
4. **Production domain and email sender configured.**

See `LAUNCH_COMPLIANCE_CHECKLIST.md` for the full pre-launch list.
