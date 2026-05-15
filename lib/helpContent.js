/**
 * Static help center content — no CMS required.
 * Two audience tracks: operators (shop admins/techs) and customers.
 */

export const HELP_CATEGORIES = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    icon: '🚀',
    description: 'Set up your shop, configure payments, and take your first repair.',
    audience: 'operator',
    color: '#dcfce7',
    colorFg: '#15803d',
  },
  {
    slug: 'managing-repairs',
    title: 'Managing repairs',
    icon: '🔧',
    description: 'Walk-in intake, status updates, estimates, and the repair workflow.',
    audience: 'operator',
    color: '#dbeafe',
    colorFg: '#1d4ed8',
  },
  {
    slug: 'appointments',
    title: 'Appointments',
    icon: '📅',
    description: 'Confirm drop-off times, view your calendar, and convert appointments to orders.',
    audience: 'operator',
    color: '#fef3c7',
    colorFg: '#92400e',
  },
  {
    slug: 'payments-billing',
    title: 'Payments & billing',
    icon: '💳',
    description: 'Stripe Connect, deposits, invoices, and your platform subscription.',
    audience: 'operator',
    color: '#f3e8ff',
    colorFg: '#6b21a8',
  },
  {
    slug: 'team-settings',
    title: 'Team & settings',
    icon: '⚙️',
    description: 'Invite technicians, manage roles, and customize your shop profile.',
    audience: 'operator',
    color: '#e0f2fe',
    colorFg: '#0369a1',
  },
  {
    slug: 'tracking-repairs',
    title: 'Tracking your repair',
    icon: '🔍',
    description: 'Check your repair status, read status updates, and message the shop.',
    audience: 'customer',
    color: '#dcfce7',
    colorFg: '#15803d',
  },
  {
    slug: 'booking-appointments',
    title: 'Booking an appointment',
    icon: '🗓️',
    description: 'Schedule a drop-off time and know what to bring.',
    audience: 'customer',
    color: '#fef3c7',
    colorFg: '#92400e',
  },
  {
    slug: 'estimates-payments',
    title: 'Estimates & payments',
    icon: '📄',
    description: 'Approve estimates, pay deposits, and settle your final balance.',
    audience: 'customer',
    color: '#f3e8ff',
    colorFg: '#6b21a8',
  },
]

export const HELP_ARTICLES = [
  // ── Getting started ─────────────────────────────────────────────────────────
  {
    slug: 'set-up-your-shop-profile',
    category: 'getting-started',
    title: 'How to set up your shop profile',
    excerpt: 'Add your shop name, logo, colors, and contact info so customers know who you are.',
    readMinutes: 3,
    content: `
## Why your shop profile matters

Your shop profile powers your public booking page, customer emails, and receipts. A complete profile builds trust and helps customers find you.

## What to fill in

Go to **Admin → Settings** to access your shop profile.

### Basic info
- **Shop name** — used on emails, receipts, and your public page
- **Slug** — the URL-friendly name for your shop (e.g. \`acme-repairs\` → \`/shop/acme-repairs\`)
- **Phone** and **address** — shown to customers on your booking page
- **Support email** — where customer replies go

### Branding
- **Logo URL** — paste a direct link to your logo image (JPG, PNG, or SVG)
- **Primary color** — the main button and accent color on customer-facing pages
- **Accent color** — secondary highlights
- **Hero headline** — the main tagline on your shop landing page (e.g. "Fast, reliable phone repair")
- **Hero subtext** — a short sentence below the headline

## Preview your shop page

Once saved, click **Preview shop page** in the Settings panel to see exactly what customers see at \`/shop/your-slug\`.

## Tips

- Use a square logo (200×200px minimum) for best results across email and web
- Your primary color should have enough contrast against white text — aim for a dark green, blue, or similar
- You can update your profile anytime; changes take effect immediately
    `,
    related: ['invite-team-members', 'configure-payments', 'add-pricing-rule'],
  },
  {
    slug: 'invite-team-members',
    category: 'getting-started',
    title: 'How to invite team members',
    excerpt: 'Add technicians and admins to your shop so they can manage repairs and appointments.',
    readMinutes: 2,
    content: `
## Roles

| Role | Can do |
|------|--------|
| **Owner** | Everything — billing, settings, full admin |
| **Admin** | All repair operations + team management |
| **Tech** | View and update assigned repairs |

## Sending an invite

1. Go to **Admin → Team**
2. Click **Invite member**
3. Enter the person's email address and choose their role
4. Click **Send invite**

The invitee receives an email with a link to accept the invitation. The link expires after 7 days.

## Pending invites

Invites waiting to be accepted appear in the **Pending** section of the Team page. You can resend or cancel an invite at any time.

## Changing a member's role

Click the **Edit** button next to any active member to change their role. You cannot demote the only owner.

## Removing a member

Click **Remove** next to a member to revoke their access immediately. Their account is not deleted — they simply lose access to your shop's data.
    `,
    related: ['set-up-your-shop-profile', 'configure-payments'],
  },
  {
    slug: 'configure-payments',
    category: 'getting-started',
    title: 'How to configure payments',
    excerpt: 'Connect Stripe to accept card payments, or configure manual payment instructions.',
    readMinutes: 4,
    content: `
## Payment modes

Go to **Admin → Settings → Payment settings** to choose your payment mode.

### Stripe Connect (recommended)

Accept card payments directly from customers via Stripe. A small platform fee of 0.75% applies per transaction; Stripe's standard processing fee (2.9% + 30¢) also applies.

**Setup:**
1. Click **Connect Stripe** in the Billing section
2. Complete Stripe's onboarding (takes about 5 minutes)
3. Once approved, your shop can accept card deposits and final balance payments

### Manual payments

If you prefer cash, Venmo, Zelle, CashApp, or Square, choose **Manual** mode and enter your payment instructions. These instructions are shown to customers when they approve an estimate or need to pay a balance.

Fields you can configure:
- **Instructions** — plain text shown to customers (e.g. "Pay via Venmo to @acme-repairs")
- **CashApp tag** — displayed as a shortcut
- **Zelle contact** — phone or email
- **Square payment URL** — a direct payment link

## Inspection deposits

When you send an estimate that requires a deposit, customers are directed to pay using your configured payment method before repair begins.

You can mark a deposit as paid manually from the repair order page if the customer pays in person.
    `,
    related: ['set-up-your-shop-profile', 'add-pricing-rule', 'invoices-and-receipts'],
  },
  {
    slug: 'add-pricing-rule',
    category: 'getting-started',
    title: 'How to add your first pricing rule',
    excerpt: 'Set fixed prices or price ranges for specific device models and repair types.',
    readMinutes: 3,
    content: `
## What is a pricing rule?

A pricing rule links a **device model** (e.g. iPhone 15) to a **repair type** (e.g. Screen replacement) and sets the price customers see on your estimate form.

## Adding a rule

1. Go to **Admin → Pricing**
2. Click **+ Add Rule**
3. Select the device model from the dropdown
4. Select the repair type
5. Choose a pricing mode:
   - **Fixed** — exact price (e.g. \$149)
   - **Range** — a min/max range (e.g. \$99–\$149) displayed to customers
   - **Manual** — price is determined during inspection; no price shown upfront
6. Optionally set an inspection deposit amount
7. Click **Save rule**

## Activating and deactivating rules

Rules can be toggled active/inactive with the switch on each rule row. Inactive rules are hidden from customers but preserved for reference.

## Editing a rule

Click the **Edit** icon on any rule row to update the price mode, amounts, or deposit.

## Tips

- Start with your most common repairs (screen replacements, battery swaps) and add more over time
- Use **Range** pricing when your actual cost varies by device condition
- Set a deposit amount for expensive or time-consuming repairs to reduce no-shows
    `,
    related: ['set-up-your-shop-profile', 'configure-payments', 'manage-your-catalog'],
  },

  // ── Managing repairs ────────────────────────────────────────────────────────
  {
    slug: 'repair-workflow-overview',
    category: 'managing-repairs',
    title: 'Understanding the repair workflow',
    excerpt: 'From quote request to completed repair — a walkthrough of every step.',
    readMinutes: 5,
    content: `
## The full repair lifecycle

\`\`\`
Quote submitted → Estimate sent → Deposit paid → Repair in progress → Complete → Paid
\`\`\`

### 1. Quote submitted

A customer fills out your estimate form at \`/shop/your-slug/estimate\` (or walks in). The quote appears in **Admin → Quotes** with status **Submitted**.

### 2. Estimate sent

Open the quote and click **Send estimate**. Enter the repair price, optional deposit, and any notes. The customer receives an email with a link to review and approve.

### 3. Customer approves

The customer clicks **Approve** in their email. If a deposit is required, they pay it (via Stripe or your manual payment method). The repair order is created and appears in **Admin → Orders**.

### 4. Repair in progress

Update the status as work progresses:
- **Received** — device checked in
- **Inspecting** — diagnosing the issue
- **Repairing** — active work in progress
- **Awaiting balance payment** — repair done, waiting for final payment
- **Ready to ship / ship** — ready for pickup or shipping

Customer receives email/SMS updates at each step (where contact info is available).

### 5. Complete

Once shipped or picked up, mark the order as **Delivered**. Send a receipt from the order page.

## Walk-in orders

For in-person customers, use **Walk-in** (sidebar) to create a repair order immediately without the estimate email loop. See [How to create a walk-in order](/help/managing-repairs/create-walk-in-order).
    `,
    related: ['create-walk-in-order', 'update-repair-status', 'send-estimates'],
  },
  {
    slug: 'create-walk-in-order',
    category: 'managing-repairs',
    title: 'How to create a walk-in order',
    excerpt: 'Take in a repair order for an in-person customer without the online quote flow.',
    readMinutes: 3,
    content: `
## When to use walk-in intake

Use the walk-in flow when a customer arrives in person and you want to create a repair order immediately — bypassing the estimate email approval loop.

## Starting a walk-in order

1. Click **Walk-in** in the sidebar
2. **Step 1 — Customer**: Search for an existing customer by name, phone, or email. Select them, or choose "New customer" and fill in their details
3. **Step 2 — Device & repair**: Select the device category, enter brand and model, and describe the repair needed
4. **Step 3 — Finalize**: Optionally enter an agreed price, assign a technician, and add internal notes
5. Click **Create Order**

You're taken directly to the new repair order page.

## Converting an appointment

If the customer had a pre-booked appointment, you can convert it to an order in one click:
- In the **Appointments** list, find their confirmed appointment and click **Convert →**
- Or in the calendar view, click the appointment block and click **Convert to order →**

The customer's name, device, and repair description are pre-filled automatically.

## Sending an intake confirmation

If you have the customer's email, you can send them a "Your repair has been received" confirmation from the order page:
1. Open the repair order
2. Click **Send Intake Confirmation** in the action bar
    `,
    related: ['repair-workflow-overview', 'update-repair-status', 'send-estimates'],
  },
  {
    slug: 'update-repair-status',
    category: 'managing-repairs',
    title: 'How to update repair status',
    excerpt: 'Move repairs through the workflow and keep customers automatically notified.',
    readMinutes: 3,
    content: `
## Updating status from the order page

1. Open the repair order (from **Orders** queue or via search)
2. In the **Status** dropdown, select the new status
3. Optionally add a customer-visible note
4. Click **Save changes**

The customer receives an email (and SMS if phone is on file) when you move to any customer-facing status.

## Status reference

| Status | Customer notified? | Notes |
|--------|--------------------|-------|
| Received | Yes | Device checked in |
| Inspecting | Yes | Diagnosing the problem |
| Awaiting parts | No | Internal only |
| Repairing | Yes | Active repair in progress |
| Awaiting balance payment | Yes | Triggers payment request link |
| Ready to ship | Yes | Ready for pickup |
| Shipped | Yes | Tracking info email |
| Delivered | Yes | Final status |
| Cancelled | Yes | |
| No fault found | Yes | No defect detected |
| Beyond economical repair | Yes | Cost exceeds device value |

## Bulk updates

Currently, status must be updated one order at a time. The Orders queue shows all current statuses at a glance with inline editing.

## Priority and due dates

Set priority (Low / Normal / High / Urgent) and a due date directly from the Orders queue using the inline edit controls. Overdue orders appear highlighted in the SLA dashboard.
    `,
    related: ['repair-workflow-overview', 'create-walk-in-order', 'invoices-and-receipts'],
  },
  {
    slug: 'send-estimates',
    category: 'managing-repairs',
    title: 'How to send estimates to customers',
    excerpt: 'Send a priced estimate for approval and optionally require an inspection deposit.',
    readMinutes: 4,
    content: `
## When to send an estimate

After inspecting the device, send an estimate to get the customer's approval before starting work. Estimates are delivered by email with an "Approve" button.

## Sending a first estimate

1. Open the quote in **Admin → Quotes**
2. Click **Send estimate**
3. Fill in:
   - **Repair description** — what you found and what needs to be done
   - **Line items** — parts and labor (can add multiple rows)
   - **Inspection deposit** — amount required before work begins (optional)
   - **Validity period** — how long the estimate is valid
4. Click **Send to customer**

The customer receives an email with all details and a secure "Approve estimate" link.

## Revised estimates

If the scope changes mid-repair, use **Send revised estimate** from the order page. The customer receives a new email and must re-approve.

## Approved estimates

When a customer approves:
- If a deposit is required, they're directed to pay it
- Once paid (or if no deposit), the repair order moves to **Repairing** status
- You're notified by email

## Tips

- Write a clear repair description — customers are more likely to approve when they understand what's happening
- Set a reasonable deposit (20–50% of total) for expensive repairs to reduce no-shows
- Use the revised estimate flow if parts costs change, rather than calling the customer
    `,
    related: ['repair-workflow-overview', 'configure-payments', 'invoices-and-receipts'],
  },
  {
    slug: 'invoices-and-receipts',
    category: 'managing-repairs',
    title: 'Invoices and receipts',
    excerpt: 'View, print, and email invoices and receipts to customers.',
    readMinutes: 2,
    content: `
## Viewing an invoice

From any repair order page, click **View Invoice** to open a printable invoice in a new tab. The invoice includes:
- Your shop branding
- Customer and device info
- Line items from the estimate
- Payment history and outstanding balance

Click **Print** or use your browser's print function.

## Sending a receipt

Once a repair is paid in full:
1. Open the repair order
2. Click **Send Receipt**

The customer receives an HTML receipt by email showing all line items and the total paid.

## Customer history

A customer's full repair history and lifetime spend is available at **Admin → Customers → [customer name]**.
    `,
    related: ['send-estimates', 'configure-payments', 'repair-workflow-overview'],
  },

  // ── Appointments ────────────────────────────────────────────────────────────
  {
    slug: 'how-customers-book',
    category: 'appointments',
    title: 'How customers book appointments',
    excerpt: 'Your public booking page URL, what customers fill in, and the confirmation email.',
    readMinutes: 2,
    content: `
## Your booking page

Customers can book a drop-off appointment at:

\`\`\`
https://your-domain.com/shop/your-slug/book
\`\`\`

This page is linked from your shop landing page automatically.

## What customers fill in

- First name (required)
- Email address (required — for confirmation)
- Phone number (optional)
- Device brand and model
- Description of the issue
- Preferred date and time

The earliest bookable slot is 1 hour from the current time.

## Confirmation email

After submitting, the customer receives an email confirming their requested time. Appointments start in **Pending** status until you confirm them.

## Where to find new bookings

Go to **Admin → Appointments**. New bookings appear in the **Pending** tab with an orange count badge in the sidebar.
    `,
    related: ['confirm-cancel-appointments', 'convert-appointment-to-order'],
  },
  {
    slug: 'confirm-cancel-appointments',
    category: 'appointments',
    title: 'How to confirm or cancel appointments',
    excerpt: 'Accept or decline appointment requests and optionally record a cancellation reason.',
    readMinutes: 2,
    content: `
## Confirming an appointment

1. Go to **Admin → Appointments**
2. Find the pending appointment in the list or calendar view
3. Click **Confirm**

The appointment status changes to **Confirmed**. (No automatic email is sent to the customer at this step — the confirmation email was sent when they booked.)

## Cancelling an appointment

1. Click **Cancel** next to the appointment
2. An input field appears — enter a reason (optional)
3. Click **Confirm cancel**

A cancellation timestamp is recorded. No automatic email is sent, so you may want to contact the customer directly.

## Marking no-show

If a customer doesn't appear at their appointment time, click **No-show** to record it. The appointment status changes to **No show** and is excluded from your upcoming count.

## Calendar view

Switch to **Calendar** view at the top of the Appointments page to see all appointments in a week-view grid. Click any appointment block to see full details and action buttons.
    `,
    related: ['how-customers-book', 'convert-appointment-to-order'],
  },
  {
    slug: 'convert-appointment-to-order',
    category: 'appointments',
    title: 'Converting an appointment to a repair order',
    excerpt: 'When the customer arrives, turn a confirmed appointment into a walk-in repair order in one click.',
    readMinutes: 2,
    content: `
## Why convert?

Booking an appointment and creating a repair order are separate steps. When the customer arrives for their appointment, you convert it to create the actual repair order so you can track the repair through your workflow.

## How to convert

### From the list view

1. Go to **Admin → Appointments**
2. Find the confirmed appointment
3. Click **Convert →**
4. Confirm the prompt

### From the calendar view

1. Switch to **Calendar** view
2. Click the appointment block
3. In the detail panel that appears, click **Convert to order →**

## What happens

- A repair order is created immediately with the customer's name, device, and repair description pre-filled
- The appointment status changes to **Converted**
- You're taken directly to the new repair order page
- If the customer is new, a customer record is created automatically

## After converting

From the repair order page you can update status, assign a technician, send an estimate, or send an intake confirmation email if the customer provided their email address.
    `,
    related: ['confirm-cancel-appointments', 'how-customers-book', 'create-walk-in-order'],
  },

  // ── Payments & billing ──────────────────────────────────────────────────────
  {
    slug: 'stripe-connect-setup',
    category: 'payments-billing',
    title: 'Setting up Stripe Connect',
    excerpt: 'Connect your Stripe account to accept card payments from customers.',
    readMinutes: 4,
    content: `
## How Stripe Connect works

The platform uses Stripe Connect (Express accounts) so that:
- Customers pay using the platform's Stripe integration
- Funds are transferred directly to your Stripe account, minus a 0.75% platform fee
- You see payouts in your own Stripe dashboard

## Setup steps

1. Go to **Admin → Billing**
2. In the **Accept Payments** section, click **Connect with Stripe**
3. You'll be redirected to Stripe's onboarding — complete the form (takes ~5 minutes)
4. Once Stripe approves your account, return to the Billing page and click **Refresh status**
5. Your account status should show **Connected** with a green dot

## Account capabilities

Two capabilities are shown:
- **Charges enabled** — you can accept payments
- **Payouts enabled** — funds can be transferred to your bank

Both must be enabled before live transactions work. If one is disabled, revisit Stripe to complete any outstanding requirements.

## Platform fee

A 0.75% platform fee is deducted from each transaction. This is separate from Stripe's own processing fee (2.9% + 30¢ in the US). The platform fee is shown on your Stripe dashboard as an application fee.

## Disconnecting

To disconnect, use the **Manage Subscription** button to access your Stripe portal, then manage your connected account from there.
    `,
    related: ['configure-payments', 'platform-subscription', 'invoices-and-receipts'],
  },
  {
    slug: 'platform-subscription',
    category: 'payments-billing',
    title: 'Platform subscription and billing',
    excerpt: 'Understand your trial period, plan pricing, and how to manage your subscription.',
    readMinutes: 3,
    content: `
## Trial period

New shops start with a 14-day free trial. No credit card is required to start. You can access all features during the trial.

When your trial ends, access is paused until you subscribe. You'll receive email warnings at 3 days and 1 day before expiry.

## The Pro plan

The Pro plan gives you full access to all features: unlimited repairs, team members, customer tracking, calendar, analytics, and more. Pricing is shown on the billing page.

## Subscribing

1. Go to **Admin → Billing**
2. Click **Upgrade to Pro**
3. You're redirected to Stripe Checkout to enter your card
4. After payment, your subscription activates immediately

## Managing your subscription

Click **Manage Subscription** on the Billing page to access the Stripe Customer Portal where you can:
- Update your payment method
- View invoices
- Cancel your subscription

## What happens if I cancel?

Your subscription stays active until the end of the current billing period. After that, access is paused. Your data is preserved — you can resubscribe at any time to regain access.

## Reactivating after suspension

If your account is suspended (trial expired or payment failed), go to **Admin → Billing** and click **Upgrade to Pro** to resubscribe.
    `,
    related: ['stripe-connect-setup', 'configure-payments'],
  },
  {
    slug: 'deposit-and-balance-payments',
    category: 'payments-billing',
    title: 'How deposits and final balance payments work',
    excerpt: 'Collect inspection deposits upfront and request final payment when the repair is done.',
    readMinutes: 3,
    content: `
## Inspection deposit

An inspection deposit is collected from the customer before repair begins. It's set when you send an estimate.

**When the customer approves:**
- If you use Stripe: the customer is directed to a Stripe payment page immediately
- If you use manual payments: the customer sees your payment instructions (CashApp, Zelle, etc.)

**Marking a deposit paid manually:**
If the customer pays in person (cash, card terminal), mark the deposit as paid from the repair order page:
1. Open the repair order
2. Click **Mark Deposit Paid** in the action bar
3. The deposit is recorded and the payment summary updates

## Final balance payment

When the repair is complete and you're ready for final payment:
1. Open the repair order
2. Click **Request Final Balance** — the amount due is shown in the button
3. The customer receives an email with a payment link

Once paid, the order moves to the next status automatically.

## Payment history

All payments (deposits, final balances, manual records) are shown in the **Payment summary** section on the repair order page.
    `,
    related: ['send-estimates', 'stripe-connect-setup', 'invoices-and-receipts'],
  },

  // ── Team & settings ─────────────────────────────────────────────────────────
  {
    slug: 'manage-your-catalog',
    category: 'team-settings',
    title: 'How to manage your device catalog',
    excerpt: 'Add custom device brands, models, and repair types to your pricing catalog.',
    readMinutes: 3,
    content: `
## Global vs. custom catalog items

The platform includes a global catalog of common device brands, models, and repair types (iPhone models, Samsung models, common repair types). These are read-only — you can build pricing rules on top of them but cannot edit them.

You can add your own **custom items** for devices or repairs not in the global catalog.

## Adding a custom brand

1. Go to **Admin → Catalog**
2. Click the **Brands** tab
3. Click **+ Add brand**
4. Enter the brand name and select a device category (Phone, Tablet, Laptop, Other)
5. Click **Save**

## Adding a custom model

1. Click the **Models** tab
2. Click **+ Add model**
3. Select the brand, enter the model name
4. Click **Save**

## Adding a custom repair type

1. Click the **Repair types** tab
2. Click **+ Add repair type**
3. Enter the repair name and select a default pricing mode
4. Click **Save**

## Deleting custom items

Only your custom items can be deleted. Click **Delete** next to any custom item. Note: deleting a brand removes all its models and any pricing rules linked to them.
    `,
    related: ['add-pricing-rule', 'invite-team-members', 'set-up-your-shop-profile'],
  },

  // ── Tracking repairs (customer) ─────────────────────────────────────────────
  {
    slug: 'how-to-track-your-repair',
    category: 'tracking-repairs',
    title: 'How to track your repair',
    excerpt: 'Use your quote ID or order number to check your repair status at any time.',
    readMinutes: 2,
    content: `
## Finding your tracking ID

When you submit a repair request, you'll receive a confirmation email containing your **Quote ID** (e.g. \`RCQ-0042\`) or **Order number** (e.g. \`RCO-0042\`). Either one works for tracking.

## Tracking your repair

1. Visit your shop's tracking page at \`/shop/your-slug/track\`
   (the URL is in your confirmation email)
2. Enter your Quote ID or Order number
3. Enter your email address to verify your identity
4. Click **Track**

Your current status, timeline, and any messages from the shop are displayed.

## Status updates

You receive an email (and SMS if you provided a phone number) whenever your repair status changes. Common statuses you'll see:

- **Received** — the shop has your device
- **Inspecting** — diagnosing the issue
- **Repairing** — work is in progress
- **Awaiting balance payment** — repair is done; final payment needed
- **Ready for pickup** — come collect your device
- **Shipped** — your device is on its way (if shipping)

## Messaging the shop

From the tracking page, you can send a message to the shop directly. They'll see it in their admin panel and reply by email.
    `,
    related: ['understanding-repair-statuses', 'approve-estimate'],
  },
  {
    slug: 'understanding-repair-statuses',
    category: 'tracking-repairs',
    title: 'Understanding repair status labels',
    excerpt: 'What each status means and what to expect next.',
    readMinutes: 2,
    content: `
## Status guide

| Status | What it means | What to expect next |
|--------|---------------|---------------------|
| **Submitted** | Your request was received | The shop will review and send an estimate |
| **Received** | The shop has your device | They'll inspect it and send an estimate |
| **Inspecting** | Device is being diagnosed | You may receive a revised estimate |
| **Awaiting deposit** | Estimate approved; deposit needed | Pay your deposit to authorize repair |
| **Repairing** | Active repair in progress | Wait for completion notification |
| **Awaiting balance payment** | Repair done; final payment needed | Pay the remaining balance |
| **Ready for pickup** | Come collect your device | Bring your ID; arrange a time with the shop |
| **Shipped** | Device sent back to you | Check your tracking number in the email |
| **Delivered** | Repair complete | Leave a review if prompted! |
| **Cancelled** | Repair was cancelled | Contact the shop with questions |
| **No fault found** | No defect detected | Device returned as-is |
| **Beyond economical repair** | Cost exceeds device value | Discuss options with the shop |

## Not seeing your device?

If your status hasn't changed in more than 2 business days, use the tracking page to send a message to the shop directly.
    `,
    related: ['how-to-track-your-repair', 'approve-estimate'],
  },
  {
    slug: 'contact-the-shop',
    category: 'tracking-repairs',
    title: 'How to message the shop',
    excerpt: 'Send questions or updates directly to the repair shop from the tracking page.',
    readMinutes: 1,
    content: `
## Sending a message

1. Go to your repair tracking page (link in your confirmation email, or visit \`/shop/your-slug/track\`)
2. Enter your Quote ID / Order number and email to verify
3. Scroll to the **Send a message** section
4. Type your message and click **Send**

The shop sees your message in their admin panel and can reply. Replies are sent to your email address.

## Tips

- Include your Quote ID in messages for faster responses
- For urgent issues, call the shop directly — messaging is best for non-urgent questions
- Message history is shown on the tracking page so you can see the conversation thread
    `,
    related: ['how-to-track-your-repair', 'understanding-repair-statuses'],
  },

  // ── Booking appointments (customer) ─────────────────────────────────────────
  {
    slug: 'how-to-book-appointment',
    category: 'booking-appointments',
    title: 'How to book a drop-off appointment',
    excerpt: 'Schedule a time to bring your device in for repair.',
    readMinutes: 2,
    content: `
## Before you book

Booking an appointment reserves a time slot for you to drop off your device. It does not guarantee a repair price — the shop will inspect your device and send an estimate after you drop it off.

If you'd like a price estimate before coming in, submit an online quote request from the shop's estimate form instead.

## Booking steps

1. Go to the shop's booking page at \`/shop/your-slug/book\`
2. Fill in your contact details (name, email, phone)
3. Describe your device and the issue
4. Select your preferred date and time (earliest is 1 hour from now)
5. Click **Request appointment**

You'll receive a confirmation email. The shop reviews the request and confirms it.

## After booking

Your appointment starts as **Pending** while the shop reviews. They may contact you by email or phone to confirm.

On the day of your appointment, bring:
- Your device
- Any accessories related to the issue (charger, case, etc.)
- Your confirmation email (optional but helpful)

## Rescheduling or cancelling

To reschedule or cancel, contact the shop directly using the phone number or email in your confirmation.
    `,
    related: ['what-to-bring', 'how-to-track-your-repair'],
  },
  {
    slug: 'what-to-bring',
    category: 'booking-appointments',
    title: 'What to bring to your appointment',
    excerpt: 'Prepare for your drop-off to help the shop diagnose and repair your device faster.',
    readMinutes: 2,
    content: `
## Essential items

- **Your device** — make sure it's fully charged or bring your charger
- **Passcode or PIN** — the technician may need to test the device after repair; let them know if you prefer to enter it yourself
- **Any accessories** — if the issue involves charging, bring your cable and adapter

## Helpful to bring

- **Proof of purchase** — for warranty claims
- **Your confirmation email** — speeds up the check-in process
- **Notes about the issue** — when it started, what you were doing when it happened, any error messages you saw

## Data backup

**Back up your data before dropping off.** While reputable shops take care to preserve your data, repairs can sometimes result in data loss, especially for motherboard or water damage repairs. Use iCloud, Google Backup, or your computer to back up photos, contacts, and app data.

## What to leave behind

You don't need to bring the original box or accessories unless they're related to the issue. Leave valuable accessories at home.
    `,
    related: ['how-to-book-appointment', 'how-to-track-your-repair'],
  },

  // ── Estimates & payments (customer) ─────────────────────────────────────────
  {
    slug: 'approve-estimate',
    category: 'estimates-payments',
    title: 'How to approve an estimate',
    excerpt: 'Review and accept or decline a repair estimate from the shop.',
    readMinutes: 2,
    content: `
## Receiving an estimate

After the shop inspects your device, you'll receive an email with a repair estimate. The email includes:
- A description of what's needed
- Line items with prices
- Deposit amount (if required)
- An expiry date for the estimate

## Reviewing the estimate

Click the **Review estimate** link in the email. You'll see the full estimate on a secure page.

## Approving

Click **Approve estimate** if you're happy with the price and want to proceed.

If a deposit is required:
- **Stripe payments**: you'll be redirected to a payment page to pay by card
- **Manual payments**: you'll see payment instructions (CashApp, Zelle, etc.) and pay directly to the shop

Once approved (and deposit paid if required), your repair begins.

## Declining

If you don't want to proceed, contact the shop directly — there's no decline button in the current flow. The estimate expires automatically after the validity period.

## Revised estimates

If the shop discovers additional issues mid-repair, they may send a revised estimate. You'll receive a new email and must approve the revised price before work continues.
    `,
    related: ['pay-deposit', 'pay-final-balance', 'how-to-track-your-repair'],
  },
  {
    slug: 'pay-deposit',
    category: 'estimates-payments',
    title: 'How to pay your inspection deposit',
    excerpt: 'Pay the upfront deposit to authorize the shop to start your repair.',
    readMinutes: 2,
    content: `
## What is an inspection deposit?

Some shops require a deposit before starting work — typically 20–50% of the repair cost. This ensures the shop is compensated for their time even if the repair turns out to be more complex than expected.

## Paying a deposit

### Via Stripe (card payment)

After approving the estimate, you're redirected to a Stripe payment page. Enter your card details and click **Pay**. You'll receive a payment confirmation email.

### Via manual payment (CashApp, Zelle, etc.)

After approving the estimate, the payment instructions page shows the shop's payment details. Send the payment using the method they've configured (CashApp tag, Zelle phone/email, Square link, etc.).

The shop manually marks your deposit as paid after receiving it.

## Tracking deposit status

Your deposit status is shown on the repair tracking page. Look for the payment summary section.

## Questions about your deposit?

Contact the shop directly if you're unsure whether your deposit was received, especially for manual payments.
    `,
    related: ['approve-estimate', 'pay-final-balance', 'how-to-track-your-repair'],
  },
  {
    slug: 'pay-final-balance',
    category: 'estimates-payments',
    title: 'How to pay your final balance',
    excerpt: 'Pay the remaining balance once your repair is complete.',
    readMinutes: 2,
    content: `
## When to pay the final balance

When your repair is done, the shop updates your order status to **Awaiting balance payment** and sends you an email with a payment link.

## Paying via Stripe

Click the **Pay balance** link in the email. You're taken to a secure Stripe payment page. Enter your card details and click **Pay**.

After payment, you'll receive a receipt email and your order status updates to the next stage (usually Ready for pickup or Shipped).

## Paying via manual methods

If the shop uses manual payments, the email shows their payment instructions. Send the amount via CashApp, Zelle, or whichever method they've configured.

The shop marks your payment as received manually and contacts you when your device is ready.

## Balance amount

The final balance is the total repair price minus any deposit you already paid. You can see the breakdown on your tracking page and on the receipt.

## Something doesn't look right?

If the balance amount seems incorrect, message the shop from your tracking page or contact them directly before paying.
    `,
    related: ['approve-estimate', 'pay-deposit', 'how-to-track-your-repair'],
  },
]

// Build lookup maps for fast access
export const CATEGORY_MAP = Object.fromEntries(HELP_CATEGORIES.map((c) => [c.slug, c]))
export const ARTICLE_MAP = Object.fromEntries(HELP_ARTICLES.map((a) => [a.slug, a]))

export function getArticlesByCategory(categorySlug) {
  return HELP_ARTICLES.filter((a) => a.category === categorySlug)
}

export function getRelatedArticles(articleSlug) {
  const article = ARTICLE_MAP[articleSlug]
  if (!article) return []
  return (article.related || [])
    .map((slug) => ARTICLE_MAP[slug])
    .filter(Boolean)
    .slice(0, 3)
}

export function searchArticles(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase()
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  ).slice(0, 8)
}
