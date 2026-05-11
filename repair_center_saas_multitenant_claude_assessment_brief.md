# Claude Code Assessment Brief: Convert Repair Center Into Multi-Tenant SaaS

## Purpose

I want you to assess my existing `repair-center` app and Supabase database to determine the safest and most correct way to convert it from a single-business repair website/app into a multi-tenant SaaS product for multiple repair shops.

The product direction is:

> A repair shop SaaS that lets independent phone/device repair techs, mall kiosks, mobile techs, and mail-in repair businesses create a branded online repair portal where customers can get instant quotes, submit repair requests, upload photos, approve estimates, pay/track deposits, mail devices in, and track repairs until return shipment.

Please **assess first**. Do **not** modify production data or apply migrations until you produce a clear report and migration plan.

---

## Current Business Context

This app was originally built for my own phone/device repair business. Several friends who own repair centers are interested in using it too.

The first real user need came from a repair-shop friend who wants to:

- accept repair orders online
- give customers instant quotes online
- copy/share the repair link on social media
- support mail-in and mail-back repairs
- receive more repair orders from Instagram/Facebook/TikTok/Google traffic
- let customers track status instead of constantly texting/calling

The SaaS should satisfy that need first, then later grow into broader repair-shop software with inventory, POS, staff tools, etc.

---

## Current App Summary

From prior repo audit, the current app appears to already include many single-shop repair workflow features:

### Already Built or Partially Built

- Public homepage
- Instant estimate page
- Full estimate request form
- Customer photo upload
- Quote ID generation
- Supabase backend schema
- Quote request API
- Admin quote dashboard
- Admin quote detail page
- Estimate builder
- Customer estimate review/approval page
- Mail-in instruction page
- Stripe deposit checkout flow
- Stripe webhook for deposits
- Repair order workflow
- Intake report fields
- Customer/internal messaging
- Customer tracking page
- Return shipment tracking fields
- Email/SMS notification foundation

### Biggest Known Gap

The app is currently structured like **one repair business**, not a SaaS platform.

It likely lacks:

- `organizations`
- `organization_members`
- shop-level branding
- shop-level mail-in settings
- shop-level pricing rules
- shop-level public slug/link
- shop onboarding
- shop subscription billing
- Stripe Connect for shop-owned payments
- tenant-safe RLS policies across all business-owned tables

---

## Desired SaaS Model

The target model is:

> One platform, many repair shops.

Each shop should have:

- its own organization/shop record
- its own owner/admin/tech users
- its own branded public page
- its own instant quote link
- its own pricing
- its own customers
- its own quote requests
- its own uploaded photos
- its own repair orders
- its own messages
- its own payments/payment instructions
- its own mail-in address/instructions
- its own notification settings
- its own subscription/billing status

One shop must never see another shop’s data.

---

## Recommended Multi-Tenant Pattern

Use organization-based multi-tenancy:

- Add `organizations`
- Add `organization_members`
- Add `organization_settings`
- Add `organization_branding`
- Add `organization_mail_in_settings`
- Add `organization_payment_settings`
- Later add `organization_billing`

Then add `organization_id` to all business-owned tables.

Expected business-owned tables likely include:

- `customers`
- `customer_addresses`
- `quote_requests`
- `quote_request_photos`
- `quote_estimates`
- `quote_estimate_items`
- `repair_orders`
- `device_intake_reports`
- `repair_order_status_history`
- `repair_messages`
- `shipments`
- `payments`
- `notifications`
- `pricing_rules`

Catalog strategy:

- Keep common device models/repair types global where possible.
- Make pricing shop-specific through `pricing_rules.organization_id`.
- Later allow shops to create custom catalog entries if needed.

---

## Desired Public Routes

Current single-shop routes likely include:

- `/instant-estimate`
- `/estimate`
- `/track/[quoteId]`
- `/mail-in/[quoteId]`
- `/estimate-review/[quoteId]`

For SaaS, add tenant-aware public routes:

- `/s/[shopSlug]`
- `/s/[shopSlug]/instant-estimate`
- `/s/[shopSlug]/estimate`
- `/s/[shopSlug]/track/[quoteId]`
- `/s/[shopSlug]/mail-in/[quoteId]`
- `/s/[shopSlug]/estimate-review/[quoteId]`

A repair shop should be able to put this in their social media bio:

`https://yourapp.com/s/friends-repair/instant-estimate`

That page should load that shop’s branding, pricing, mail-in instructions, support info, payment instructions, and repair settings.

---

## Desired Dashboard Routes

Preferred internal dashboard routes:

- `/dashboard`
- `/dashboard/quotes`
- `/dashboard/quotes/[quoteId]`
- `/dashboard/quotes/[quoteId]/estimate`
- `/dashboard/quotes/[quoteId]/order`
- `/dashboard/settings`
- `/dashboard/settings/branding`
- `/dashboard/settings/mail-in`
- `/dashboard/settings/payments`
- `/dashboard/pricing`
- `/dashboard/billing`

The authenticated user’s current organization should determine which data they can see.

If a user belongs to more than one organization, add org switching later.

---

## Critical Security Requirement

Multi-tenant isolation is the most important requirement.

Please assess the current RLS policies and recommend the safest changes.

Desired rule:

> A user can only read/write records where `organization_id` belongs to an organization they are an active member of, with the appropriate role.

Roles should likely include:

- `owner`
- `admin`
- `tech`
- `viewer`

Suggested helper functions:

- `is_org_member(org_id uuid)`
- `has_org_role(org_id uuid, allowed_roles text[])`

Do not rely only on frontend filtering. Database RLS should enforce isolation.

---

## Payments Strategy

For early beta:

- Allow manual payment tracking.
- Allow shops to enter manual payment instructions:
  - Cash App
  - Zelle
  - Square payment link
  - external payment link
  - “mark deposit paid”
  - “mark balance paid”

For later SaaS payments:

- Use Stripe subscriptions for SaaS billing.
- Use Stripe Connect for repair shops to accept payments from their own customers through the platform.
- Do not assume the platform should collect all repair payments into one Stripe account for every shop.

Please assess the current Stripe/payment code and recommend the safest path to:
1. keep current single-business Stripe flow working, and
2. prepare for multi-shop manual payments and later Stripe Connect.

---

## What I Need You To Do

Please inspect the repo and Supabase schema, then produce a detailed report.

### 1. Inspect the current repo

Identify:

- all public routes
- all admin routes
- all API routes
- all Supabase client usage
- all server-side Supabase admin usage
- all hardcoded business identity values
- all mail-in config values
- all Stripe/payment assumptions
- all notification assumptions
- all tables used by each route
- which code paths need `organization_id`

### 2. Inspect the Supabase schema

Run the schema queries below.

### 3. Assess multi-tenant readiness

For each major feature, mark:

- already tenant-safe
- easy to convert
- needs refactor
- risky / must redesign

### 4. Recommend exact migration sequence

Do not just say “add organizations.”

Give a safe order, such as:

1. create organization tables
2. create first organization for existing data
3. add nullable `organization_id` columns
4. backfill existing rows
5. add foreign keys and indexes
6. update RLS policies
7. update API routes
8. update public routes
9. update dashboard routes
10. make `organization_id` not null after validation

### 5. Identify required code changes

For each area, say what needs to change:

- quote request API
- instant estimator
- estimate form
- estimate review
- mail-in page/API
- admin dashboard
- repair order dashboard
- payment flow
- notification flow
- Supabase RLS
- storage/photo paths
- catalog/pricing logic

### 6. Provide migration SQL only after assessment

First produce an assessment and migration plan.

Do not apply migrations automatically unless explicitly asked.

---

# Supabase Schema Introspection Queries

Please run these against Supabase and include the relevant results in your assessment.

## Query 1 — List all public tables

```sql
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;
```

## Query 2 — Show columns for all tables

```sql
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

## Query 3 — Show current RLS status

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

## Query 4 — Show all current RLS policies

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Query 5 — Show foreign keys

```sql
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  tc.constraint_name
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tc.table_name, kcu.column_name;
```

## Query 6 — Check important row counts

```sql
select
  'customers' as table_name,
  count(*) as row_count
from public.customers
union all
select
  'quote_requests',
  count(*)
from public.quote_requests
union all
select
  'quote_estimates',
  count(*)
from public.quote_estimates
union all
select
  'repair_orders',
  count(*)
from public.repair_orders
union all
select
  'payments',
  count(*)
from public.payments;
```

## Query 7 — List auth users for selecting first organization owner

```sql
select
  id,
  email,
  created_at
from auth.users
order by created_at desc
limit 10;
```

---

# Draft Foundation SQL Direction

Do not run this blindly. Use it as a reference for the assessment.

```sql
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  public_name text,
  support_email text,
  support_phone text,
  website_url text,
  status text not null default 'active',
  plan_key text not null default 'beta',
  trial_ends_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_status_check check (
    status in ('active', 'trialing', 'past_due', 'suspended', 'cancelled')
  )
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  invited_email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_role_check check (
    role in ('owner', 'admin', 'tech', 'viewer')
  ),
  constraint organization_members_status_check check (
    status in ('active', 'invited', 'disabled')
  ),
  constraint organization_members_unique_user_org unique (organization_id, user_id)
);

create table if not exists public.organization_branding (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  logo_url text,
  primary_color text,
  accent_color text,
  hero_headline text,
  hero_subheadline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_mail_in_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  mail_in_enabled boolean not null default true,
  business_name text,
  support_email text,
  support_phone text,
  receiving_line1 text,
  receiving_line2 text,
  receiving_city text,
  receiving_state text,
  receiving_postal_code text,
  receiving_country text not null default 'US',
  packing_checklist text[] not null default array[
    'Back up your device before shipping if possible.',
    'Remove SIM cards, memory cards, stylus accessories, and cases unless requested.',
    'Wrap the device in protective padding and use a sturdy box.',
    'Write your quote ID clearly inside the package.',
    'Use tracked shipping and keep your receipt.'
  ],
  shipping_notes text[] not null default array[
    'Use tracked shipping.',
    'Signature confirmation is recommended for higher-value devices.',
    'Keep your shipment receipt and tracking number until intake is confirmed.'
  ],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_payment_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  payment_mode text not null default 'manual',
  manual_payment_instructions text,
  cashapp_tag text,
  zelle_contact text,
  square_payment_url text,
  stripe_connect_account_id text,
  stripe_connect_onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_payment_mode_check check (
    payment_mode in ('manual', 'platform_stripe', 'stripe_connect')
  )
);

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role = any(allowed_roles)
  );
$$;
```

---

# Specific Questions To Answer

Please answer these directly in your report:

1. Is the current schema safe to convert incrementally, or does it need a major rebuild?
2. Which tables need `organization_id` first?
3. Which routes should be converted first?
4. Can the current quote flow be preserved during conversion?
5. Can the current Stripe deposit flow be preserved for my own shop while other shops use manual payments?
6. What is the safest way to migrate existing rows to a first organization?
7. What RLS policies are currently risky?
8. What admin routes/API routes are currently not tenant-safe?
9. What hardcoded values must be moved to organization settings?
10. What should be the first PR or first migration?
11. What should not be built yet?
12. What is the expected SaaS MVP milestone?

---

# Desired Final Output Format

Please return your assessment in this format:

## 1. Executive Summary

Short explanation of how close the app is to multi-tenant SaaS.

## 2. Current Architecture Findings

Routes, tables, policies, assumptions, hardcoded values.

## 3. Multi-Tenant Gap Analysis

Feature-by-feature readiness.

## 4. Database Migration Plan

Step-by-step safe migration plan.

## 5. RLS/Security Plan

Policies, helper functions, risks.

## 6. Code Refactor Plan

Files/routes/APIs to change and in what order.

## 7. Payment Strategy

Manual payments now, Stripe Connect later, preserving current Stripe flow if possible.

## 8. First Implementation Sprint

A concrete list of first files/migrations to change.

## 9. Risks and Rollback Plan

How to avoid breaking the current app.

## 10. Final Recommendation

Whether to convert now, what to do first, and what to delay.
