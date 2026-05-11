-- Migration 001: Organization foundation tables + tenant helper functions
-- Safe to run on a live database. All CREATE TABLE uses IF NOT EXISTS.
-- No existing tables are modified.

-- ── Organization core ──────────────────────────────────────────────────────────

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  public_name text,
  support_email text,
  support_phone text,
  website_url text,
  status text not null default 'active'
    constraint organizations_status_check
    check (status in ('active', 'trialing', 'past_due', 'suspended', 'cancelled')),
  plan_key text not null default 'beta',
  trial_ends_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner'
    constraint organization_members_role_check
    check (role in ('owner', 'admin', 'tech', 'viewer')),
  invited_email text,
  status text not null default 'active'
    constraint organization_members_status_check
    check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_unique_user_org unique (organization_id, user_id)
);

-- ── Per-org settings tables ────────────────────────────────────────────────────

create table if not exists public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  mail_in_enabled boolean not null default true,
  receiving_line1 text,
  receiving_line2 text,
  receiving_city text,
  receiving_state text,
  receiving_postal_code text,
  receiving_country text not null default 'US',
  packing_checklist text[] not null default array[
    'Back up your device before shipping if possible.',
    'Remove SIM cards, memory cards, stylus accessories, and cases.',
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

create table if not exists public.organization_payment_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  payment_mode text not null default 'platform_stripe'
    constraint organization_payment_mode_check
    check (payment_mode in ('manual', 'platform_stripe', 'stripe_connect')),
  manual_payment_instructions text,
  cashapp_tag text,
  zelle_contact text,
  square_payment_url text,
  stripe_connect_account_id text,
  stripe_connect_onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

create index if not exists idx_organization_members_user_id
  on public.organization_members(user_id);
create index if not exists idx_organization_members_org_id
  on public.organization_members(organization_id);
create unique index if not exists idx_organizations_slug
  on public.organizations(slug);

-- ── Updated_at triggers ────────────────────────────────────────────────────────

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_organization_members_updated_at on public.organization_members;
create trigger trg_organization_members_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

drop trigger if exists trg_organization_settings_updated_at on public.organization_settings;
create trigger trg_organization_settings_updated_at
  before update on public.organization_settings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_organization_branding_updated_at on public.organization_branding;
create trigger trg_organization_branding_updated_at
  before update on public.organization_branding
  for each row execute function public.set_updated_at();

drop trigger if exists trg_organization_payment_settings_updated_at on public.organization_payment_settings;
create trigger trg_organization_payment_settings_updated_at
  before update on public.organization_payment_settings
  for each row execute function public.set_updated_at();

-- ── Tenant helper functions ────────────────────────────────────────────────────
-- These replace the flat profiles.role checks for multi-tenant use.
-- They are SECURITY DEFINER so they bypass RLS when reading organization_members.

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

-- Returns the organization_id of the first active org the current user belongs to.
-- Used for single-org-per-user flows (early beta).
create or replace function public.get_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select om.organization_id
  from public.organization_members om
  where om.user_id = auth.uid()
    and om.status = 'active'
  order by om.created_at
  limit 1;
$$;

-- ── RLS on org tables ──────────────────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_settings enable row level security;
alter table public.organization_branding enable row level security;
alter table public.organization_payment_settings enable row level security;

-- organizations: members can read their own org; owners/admins can update
drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists organizations_update_owner on public.organizations;
create policy organizations_update_owner on public.organizations
  for update using (public.has_org_role(id, array['owner', 'admin']))
  with check (public.has_org_role(id, array['owner', 'admin']));

-- organization_members: members can read their org's members; owners manage them
drop policy if exists org_members_select on public.organization_members;
create policy org_members_select on public.organization_members
  for select using (public.is_org_member(organization_id));

drop policy if exists org_members_manage_owner on public.organization_members;
create policy org_members_manage_owner on public.organization_members
  for all using (public.has_org_role(organization_id, array['owner']))
  with check (public.has_org_role(organization_id, array['owner']));

-- settings/branding/payment: members read, owners/admins write
drop policy if exists org_settings_select on public.organization_settings;
create policy org_settings_select on public.organization_settings
  for select using (public.is_org_member(organization_id));

drop policy if exists org_settings_manage on public.organization_settings;
create policy org_settings_manage on public.organization_settings
  for all using (public.has_org_role(organization_id, array['owner', 'admin']))
  with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists org_branding_select on public.organization_branding;
create policy org_branding_select on public.organization_branding
  for select using (public.is_org_member(organization_id));

drop policy if exists org_branding_manage on public.organization_branding;
create policy org_branding_manage on public.organization_branding
  for all using (public.has_org_role(organization_id, array['owner', 'admin']))
  with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists org_payment_settings_select on public.organization_payment_settings;
create policy org_payment_settings_select on public.organization_payment_settings
  for select using (public.is_org_member(organization_id));

drop policy if exists org_payment_settings_manage on public.organization_payment_settings;
create policy org_payment_settings_manage on public.organization_payment_settings
  for all using (public.has_org_role(organization_id, array['owner', 'admin']))
  with check (public.has_org_role(organization_id, array['owner', 'admin']));
