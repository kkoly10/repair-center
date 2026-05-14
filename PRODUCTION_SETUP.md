# Production Setup Guide

Step-by-step checklist for configuring a new production deployment. Complete these before accepting real customers.

---

## 1. Vercel environment variables

Set all of the following in **Vercel → Project → Settings → Environment Variables** for the `Production` environment. Copy `.env.example` as your reference for required vs. optional vars.

### Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never expose to client) |
| `STRIPE_SECRET_KEY` | Stripe live secret key (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe live publishable key (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/payments/webhook` (repair payments) |
| `STRIPE_BILLING_PRICE_ID` | Stripe price ID for the Founder Beta plan |
| `STRIPE_BILLING_WEBHOOK_SECRET` | Signing secret for `/api/billing/webhook` (subscriptions) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Verified sender address (`repairs@yourdomain.com`) |
| `NEXT_PUBLIC_BASE_URL` | Production URL, no trailing slash (`https://yourdomain.com`) |

### Required for legal pages

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BUSINESS_NAME` | Legal entity name shown on Platform Terms (`Acme Repair LLC`) |
| `NEXT_PUBLIC_MAILING_ADDRESS` | Physical mailing address for legal notices |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Customer-facing support email |
| `NEXT_PUBLIC_PRIVACY_EMAIL` | Privacy rights request email (may be the same as support) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | General contact email shown on `/contact` page |

### Strongly recommended

| Variable | Description |
|---|---|
| `EMAIL_LINK_SECRET` | HMAC secret for tamper-evident email links (rotate to invalidate old links) |
| `CRON_SECRET` | Bearer token required by `/api/cron/*` endpoints |

### Optional

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account SID (SMS notifications) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sender number (`+15550001234`) |
| `NEXT_PUBLIC_DEFAULT_ORG_SLUG` | Slug for legacy single-tenant routes (`/estimate`, `/portal`) |
| `DEFAULT_ORG_SLUG` | Server-side equivalent of the above |
| `NOTIFICATIONS_EMAIL_ENABLED` | Set to `false` to suppress all outbound email (staging use) |

---

## 2. Supabase settings

### Auth → URL Configuration

Add to **Allowed Redirect URLs**:
```
https://yourdomain.com/api/auth/callback
http://localhost:3000/api/auth/callback
```

Without this, customer magic-link logins will fail silently after the email is clicked.

### Auth → Email Templates (optional)

Customize the magic-link email template in the Supabase dashboard to match your brand. The default template is functional but generic.

### Database backups

Enable **Point-in-Time Recovery** or at minimum daily backups in the Supabase dashboard under **Database → Backups**.

---

## 3. Stripe webhook endpoints

Register two separate webhook endpoints in the [Stripe dashboard](https://dashboard.stripe.com/webhooks):

### Webhook 1 — Repair payments

- **URL**: `https://yourdomain.com/api/payments/webhook`
- **Events to listen for**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- **After creating**: copy the signing secret → set `STRIPE_WEBHOOK_SECRET` in Vercel

### Webhook 2 — Platform subscription billing

- **URL**: `https://yourdomain.com/api/billing/webhook`
- **Events to listen for**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **After creating**: copy the signing secret → set `STRIPE_BILLING_WEBHOOK_SECRET` in Vercel

---

## 4. Resend — verified sender domain

1. Add your domain at [resend.com/domains](https://resend.com/domains)
2. Add the DNS records Resend provides (SPF, DKIM, DMARC)
3. Wait for verification (usually a few minutes)
4. Set `EMAIL_FROM` to an address on that domain
5. Set `RESEND_API_KEY` to a production key (not a test key)

---

## 5. Vercel cron jobs

Add the following to `vercel.json` (already present in the repo):

```json
{
  "crons": [
    { "path": "/api/cron/trial-check", "schedule": "0 9 * * *" },
    { "path": "/api/cron/follow-up",   "schedule": "0 10 * * *" }
  ]
}
```

Set `CRON_SECRET` in Vercel env vars. Vercel automatically passes it as the `Authorization: Bearer` header when invoking cron routes.

Test manually after deploy:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/trial-check
curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/follow-up
```

---

## 6. Default org slug (legacy routes)

If you are migrating from the single-tenant version and need `/estimate` and `/portal` to continue working, set:

```
NEXT_PUBLIC_DEFAULT_ORG_SLUG=your-shop-slug
DEFAULT_ORG_SLUG=your-shop-slug
```

These make the legacy routes fall back to your shop's data. New multi-tenant installs can skip this.

---

## 7. Health check

After deploying, verify the health endpoint returns `200 ok: true`:

```bash
curl https://yourdomain.com/api/health | jq .
```

Expected response:
```json
{
  "ok": true,
  "checks": {
    "env": { "ok": true, "missingRequired": [], "missingOptional": [...] },
    "db":  { "ok": true, "error": null }
  },
  "ts": "2026-05-14T..."
}
```

If `env.ok` is `false`, `missingRequired` lists exactly which variables need to be set.

---

## 8. Monitoring (recommended)

- **Uptime**: add `https://yourdomain.com/api/health` to an uptime monitor (Better Uptime, UptimeRobot, etc.) with a `200` check
- **Errors**: configure Sentry or Vercel Log Drains to capture runtime errors
- **Failed notifications**: query `SELECT * FROM notifications WHERE status = 'failed' ORDER BY created_at DESC LIMIT 50` in the Supabase dashboard periodically
