# Upcoming Sprints — Repair Center Roadmap

Last updated: 2026-05-15. Builds on Sprint 38 (Mobile Admin, Appointment Calendar, Walk-in POS).

---

## Sprint 39 — Appointment → Walk-in Bridge

**Goal:** When a confirmed appointment arrives in person, staff can convert it directly to a walk-in repair order without re-entering data.

### What to build
- **`PATCH /admin/api/appointments/[appointmentId]`** — extend to accept `action: 'convert'`; runs the same logic as the walk-in route (customer upsert, quote_request insert, repair_order insert); sets `status: 'converted'` and `quote_request_id` on the appointment; returns `{ ok, quoteId, orderId, orderNumber, appointmentId }`
- **`components/AdminAppointmentsPage.js`** — "Convert to order" button on confirmed appointments (replaces the "→ Quotes" stub link); opens a minimal confirmation modal with pre-filled device info + repair description; on success redirects to `/admin/quotes/[quoteId]/order`
- **`components/AdminAppointmentCalendar.js`** — same "Convert →" button in the selected-appointment detail panel

### No migration needed
`appointments.quote_request_id` and `appointments.status = 'converted'` already exist.

---

## Sprint 40 — Walk-in Post-Intake Notification

**Goal:** After a walk-in order is created (no email sent at intake), staff can send a "Your repair has been received" notification to the customer directly from the order page.

### What to build
- **`POST /admin/api/orders/[orderId]/notify-intake`** (new) — auth-gated; verifies org ownership; requires `submission_source = 'walk_in'` on associated quote_request; fetches customer email; calls `sendRepairStatusNotification` with `status: 'received'`; 400 if no email address on file; 409 if already sent (check notifications table for existing 'received' notification for this order)
- **`components/AdminRepairOrderPage.js`** — "Send intake confirmation" button in action bar; visible when `order.quoteRequest.submission_source === 'walk_in'` and customer email exists; on success shows "Sent" state, disables button

### No migration needed

---

## Sprint 41 — Public Help Center

**Goal:** A public-facing help center at `/help` with categorized articles for shop operators and customers.

### Structure
```
/help                           → Home: search + category cards
/help/[category]               → Category page: article list
/help/[category]/[article]     → Article page: full content
```

### Categories (two tracks)
**For Shop Operators:**
- Getting started (4 articles)
- Managing repairs (5 articles)
- Appointments & calendar (3 articles)
- Payments & billing (4 articles)
- Team & settings (3 articles)

**For Customers:**
- Tracking your repair (3 articles)
- Booking an appointment (2 articles)
- Payments & estimates (3 articles)

### What to build
- **`app/help/page.js`** — search bar + category cards grid; static (no DB)
- **`app/help/[category]/page.js`** — article list for category
- **`app/help/[category]/[article]/page.js`** — full article view with breadcrumbs, table of contents, related articles
- **`lib/helpContent.js`** — static data: categories array + articles array with `slug`, `title`, `category`, `excerpt`, `content` (MDX-like string, rendered as HTML); inline so no CMS needed
- **`components/HelpSearch.js`** — `'use client'`; client-side search over article titles/excerpts; debounced; dropdown results
- **`components/SiteHeader.js`** — shared public header with Help link
- **`app/help/layout.js`** — shared layout with header + footer

### Design principles (researched from Intercom, Notion, Stripe docs patterns)
- Hero search bar is the primary entry point
- Two-track navigation (Operators / Customers) via category color coding
- Article pages: left sidebar TOC on desktop, collapsible on mobile
- Estimated read time on each article
- "Was this helpful?" thumbs at article bottom (feeds feedback)
- Related articles at bottom
- Breadcrumb navigation
- No authentication required

---

## Sprint 42 — In-App Feedback

**Goal:** A way for shop operators (and optionally customers) to submit product feedback, bug reports, and feature requests.

### Two surfaces
1. **Admin sidebar widget** — persistent "? Help & Feedback" link at bottom of sidebar; opens a slide-over panel
2. **Public feedback page** — `/feedback` for anyone to submit

### What to build
- **`POST /api/feedback`** — public endpoint; rate-limited (5/hr per IP); stores to `feedback` table; sends email to `FEEDBACK_EMAIL` env var; returns `{ ok }`
- **`supabase/migrations/20260515_024_feedback.sql`** — `feedback` table: id, type (bug/feature/general), message (text), email (nullable), page_url (nullable), org_id (nullable), created_at; RLS: INSERT open to all; SELECT to platform admins only
- **`components/FeedbackPanel.js`** — `'use client'` slide-over panel; type selector (Bug report / Feature request / General feedback); textarea; optional email pre-filled from org; submit button; thank-you state
- **`components/AdminSidebar.js`** — "Help & Feedback" button at bottom of sidebar; opens `FeedbackPanel`
- **`app/feedback/page.js`** — standalone public feedback page with same form
- **`GET /platform/api/feedback`** — platform admin only; lists all feedback with filters

### Design principles
- Type selector first (sets context)
- Textarea (not multiple questions) — lower friction
- Optional email field
- Character count on textarea (max 1000)
- Optimistic thank-you state (don't make users wait)
- No login required for public surface

---

## Implementation order

1. Sprint 39 (appointment bridge) — no new routes, extends existing PATCH
2. Sprint 40 (walk-in notification) — new notify endpoint + UI button
3. Sprint 41 (help center) — largest surface area; static content
4. Sprint 42 (feedback) — migration + API + two UI surfaces

Each sprint → own PR.

---

## Success criteria

- `npm test` passes after each sprint (no regression)
- `npm run build` clean
- `npm run lint` clean
- Self-review checklist completed before each PR merge
