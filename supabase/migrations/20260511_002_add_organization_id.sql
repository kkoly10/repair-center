-- Migration 002: Add nullable organization_id to all business-owned tables,
-- create the first organization record, assign the owner, and backfill all
-- existing rows to that organization.
--
-- Safe: all column additions are nullable first. No data is deleted.
-- Backfill targets the one real dataset (1 customer, 1 quote, 1 order, etc.)

-- ── Step 1: Add nullable organization_id columns ───────────────────────────────

alter table public.customers
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.quote_requests
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.quote_request_photos
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.quote_estimates
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.quote_estimate_items
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.repair_orders
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.repair_order_status_history
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.device_intake_reports
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.repair_messages
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.shipments
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.payments
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.notifications
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.pricing_rules
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

alter table public.customer_addresses
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade;

-- ── Step 2: Indexes on new columns ────────────────────────────────────────────

create index if not exists idx_customers_org_id on public.customers(organization_id);
create index if not exists idx_quote_requests_org_id on public.quote_requests(organization_id);
create index if not exists idx_quote_request_photos_org_id on public.quote_request_photos(organization_id);
create index if not exists idx_quote_estimates_org_id on public.quote_estimates(organization_id);
create index if not exists idx_quote_estimate_items_org_id on public.quote_estimate_items(organization_id);
create index if not exists idx_repair_orders_org_id on public.repair_orders(organization_id);
create index if not exists idx_repair_order_status_history_org_id on public.repair_order_status_history(organization_id);
create index if not exists idx_device_intake_reports_org_id on public.device_intake_reports(organization_id);
create index if not exists idx_repair_messages_org_id on public.repair_messages(organization_id);
create index if not exists idx_shipments_org_id on public.shipments(organization_id);
create index if not exists idx_payments_org_id on public.payments(organization_id);
create index if not exists idx_notifications_org_id on public.notifications(organization_id);
create index if not exists idx_pricing_rules_org_id on public.pricing_rules(organization_id);
create index if not exists idx_customer_addresses_org_id on public.customer_addresses(organization_id);

-- ── Step 3: Create the first organization ─────────────────────────────────────
-- This is your own repair shop. Slug and name can be updated via settings later.

do $$
declare
  v_org_id uuid;
  v_owner_user_id uuid := 'f0a0b7a9-4d53-4755-8d87-3f47e0bfd69b'; -- profiles.id = auth.users.id for the admin
begin

  -- Only create if no organizations exist yet
  if not exists (select 1 from public.organizations limit 1) then

    insert into public.organizations (
      name, slug, public_name, status, plan_key, created_by_user_id
    )
    values (
      'My Repair Center',
      'my-repair-center',
      'My Repair Center',
      'active',
      'beta',
      v_owner_user_id
    )
    returning id into v_org_id;

    -- Add the admin as owner
    insert into public.organization_members (organization_id, user_id, role, status)
    values (v_org_id, v_owner_user_id, 'owner', 'active');

    -- Create default settings (mail-in config placeholder — update in dashboard settings)
    insert into public.organization_settings (organization_id)
    values (v_org_id);

    -- Create default branding placeholder
    insert into public.organization_branding (organization_id)
    values (v_org_id);

    -- Create payment settings — platform Stripe (preserves your current Stripe flow)
    insert into public.organization_payment_settings (organization_id, payment_mode)
    values (v_org_id, 'platform_stripe');

    raise notice 'Created first organization: % (%)', 'My Repair Center', v_org_id;

  else
    select id into v_org_id from public.organizations order by created_at limit 1;
    raise notice 'Organization already exists: %', v_org_id;
  end if;

  -- ── Step 4: Backfill all existing rows ──────────────────────────────────────

  update public.customers
    set organization_id = v_org_id where organization_id is null;

  update public.quote_requests
    set organization_id = v_org_id where organization_id is null;

  update public.quote_request_photos
    set organization_id = v_org_id where organization_id is null;

  update public.quote_estimates
    set organization_id = v_org_id where organization_id is null;

  update public.quote_estimate_items
    set organization_id = v_org_id where organization_id is null;

  update public.repair_orders
    set organization_id = v_org_id where organization_id is null;

  update public.repair_order_status_history
    set organization_id = v_org_id where organization_id is null;

  update public.device_intake_reports
    set organization_id = v_org_id where organization_id is null;

  update public.repair_messages
    set organization_id = v_org_id where organization_id is null;

  update public.shipments
    set organization_id = v_org_id where organization_id is null;

  update public.payments
    set organization_id = v_org_id where organization_id is null;

  update public.notifications
    set organization_id = v_org_id where organization_id is null;

  update public.pricing_rules
    set organization_id = v_org_id where organization_id is null;

  update public.customer_addresses
    set organization_id = v_org_id where organization_id is null;

  raise notice 'Backfill complete for organization: %', v_org_id;

end;
$$;
