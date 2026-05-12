-- Migration 003: Enforce NOT NULL on organization_id + update RLS to be org-aware.
--
-- Run ONLY after Migration 002 has been applied and verified (all rows backfilled).
-- The NOT NULL constraints will fail if any row still has organization_id = NULL.
--
-- This migration replaces the existing single-tenant RLS policies (which used
-- is_staff() / is_admin()) with org-scoped policies that use is_org_member()
-- and has_org_role(). Staff can only see data belonging to their organization.

-- ── Step 1: Add NOT NULL constraints ──────────────────────────────────────────

alter table public.customers
  alter column organization_id set not null;

alter table public.quote_requests
  alter column organization_id set not null;

-- quote_request_photos: allow nullable — photos can exist before org assignment
-- in edge cases. Will tighten after public org routing is built.
-- alter table public.quote_request_photos alter column organization_id set not null;

alter table public.quote_estimates
  alter column organization_id set not null;

alter table public.repair_orders
  alter column organization_id set not null;

alter table public.pricing_rules
  alter column organization_id set not null;

-- Child tables (items, history, intake, messages, shipments, payments, notifications)
-- remain nullable for now — they are always accessed via their parent's org scope.
-- We'll add NOT NULL to them in a later sprint after all write paths are updated.

-- ── Step 2: Update RLS policies to be org-aware ───────────────────────────────
-- Pattern: service_role bypasses all (for API routes).
--          Authenticated staff see only their org's rows.
--          Anon users see nothing (public customer routes use service_role).

-- customers ──────────────────────────────────────────────────────────────────
drop policy if exists customers_select_policy on public.customers;
drop policy if exists customers_insert_policy on public.customers;
drop policy if exists customers_update_policy on public.customers;

drop policy if exists customers_staff_select on public.customers;
drop policy if exists customers_staff_insert on public.customers;
drop policy if exists customers_staff_update on public.customers;
create policy customers_staff_select on public.customers
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy customers_staff_insert on public.customers
  for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

create policy customers_staff_update on public.customers
  for update to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

-- quote_requests ─────────────────────────────────────────────────────────────
drop policy if exists quote_requests_select_policy on public.quote_requests;
drop policy if exists quote_requests_insert_policy on public.quote_requests;
drop policy if exists quote_requests_update_policy on public.quote_requests;

drop policy if exists quote_requests_staff_select on public.quote_requests;
drop policy if exists quote_requests_staff_insert on public.quote_requests;
drop policy if exists quote_requests_staff_update on public.quote_requests;
create policy quote_requests_staff_select on public.quote_requests
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy quote_requests_staff_insert on public.quote_requests
  for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

create policy quote_requests_staff_update on public.quote_requests
  for update to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

-- quote_estimates ─────────────────────────────────────────────────────────────
drop policy if exists quote_estimates_select_policy on public.quote_estimates;
drop policy if exists quote_estimates_insert_policy on public.quote_estimates;
drop policy if exists quote_estimates_update_policy on public.quote_estimates;

drop policy if exists quote_estimates_staff_select on public.quote_estimates;
drop policy if exists quote_estimates_staff_insert on public.quote_estimates;
drop policy if exists quote_estimates_staff_update on public.quote_estimates;
create policy quote_estimates_staff_select on public.quote_estimates
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy quote_estimates_staff_insert on public.quote_estimates
  for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

create policy quote_estimates_staff_update on public.quote_estimates
  for update to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

-- repair_orders ──────────────────────────────────────────────────────────────
drop policy if exists repair_orders_select_policy on public.repair_orders;
drop policy if exists repair_orders_insert_policy on public.repair_orders;
drop policy if exists repair_orders_update_policy on public.repair_orders;

drop policy if exists repair_orders_staff_select on public.repair_orders;
drop policy if exists repair_orders_staff_insert on public.repair_orders;
drop policy if exists repair_orders_staff_update on public.repair_orders;
create policy repair_orders_staff_select on public.repair_orders
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy repair_orders_staff_insert on public.repair_orders
  for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

create policy repair_orders_staff_update on public.repair_orders
  for update to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

-- pricing_rules ──────────────────────────────────────────────────────────────
-- Public SELECT remains (used by instant estimator — anon users need to read prices).
-- Write access restricted to org owners/admins.
drop policy if exists pricing_rules_select_policy on public.pricing_rules;
drop policy if exists pricing_rules_insert_policy on public.pricing_rules;
drop policy if exists pricing_rules_update_policy on public.pricing_rules;
drop policy if exists pricing_rules_staff_write on public.pricing_rules;
drop policy if exists pricing_rules_public_select on public.pricing_rules;
drop policy if exists pricing_rules_staff_manage on public.pricing_rules;

create policy pricing_rules_public_select on public.pricing_rules
  for select using (active = true);

create policy pricing_rules_staff_manage on public.pricing_rules
  for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin']))
  with check (public.has_org_role(organization_id, array['owner','admin']));

-- payments ───────────────────────────────────────────────────────────────────
drop policy if exists payments_select_policy on public.payments;
drop policy if exists payments_insert_policy on public.payments;
drop policy if exists payments_update_policy on public.payments;

drop policy if exists payments_staff_select on public.payments;
drop policy if exists payments_staff_insert on public.payments;
create policy payments_staff_select on public.payments
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy payments_staff_insert on public.payments
  for insert to authenticated
  with check (
    organization_id is not null
    and public.has_org_role(organization_id, array['owner','admin','tech'])
  );

-- notifications ──────────────────────────────────────────────────────────────
drop policy if exists notifications_select_policy on public.notifications;
drop policy if exists notifications_insert_policy on public.notifications;

drop policy if exists notifications_staff_select on public.notifications;
create policy notifications_staff_select on public.notifications
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

-- repair_messages ─────────────────────────────────────────────────────────────
drop policy if exists repair_messages_select_policy on public.repair_messages;
drop policy if exists repair_messages_insert_policy on public.repair_messages;
drop policy if exists repair_messages_update_policy on public.repair_messages;

drop policy if exists repair_messages_staff_select on public.repair_messages;
drop policy if exists repair_messages_staff_insert on public.repair_messages;
create policy repair_messages_staff_select on public.repair_messages
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy repair_messages_staff_insert on public.repair_messages
  for insert to authenticated
  with check (
    organization_id is not null
    and public.has_org_role(organization_id, array['owner','admin','tech'])
  );

-- shipments ──────────────────────────────────────────────────────────────────
drop policy if exists shipments_select_policy on public.shipments;
drop policy if exists shipments_insert_policy on public.shipments;
drop policy if exists shipments_update_policy on public.shipments;

drop policy if exists shipments_staff_select on public.shipments;
drop policy if exists shipments_staff_manage on public.shipments;
create policy shipments_staff_select on public.shipments
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy shipments_staff_manage on public.shipments
  for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

-- repair_order_status_history ─────────────────────────────────────────────────
drop policy if exists repair_order_status_history_select_policy on public.repair_order_status_history;

drop policy if exists status_history_staff_select on public.repair_order_status_history;
drop policy if exists status_history_staff_insert on public.repair_order_status_history;
create policy status_history_staff_select on public.repair_order_status_history
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy status_history_staff_insert on public.repair_order_status_history
  for insert to authenticated
  with check (
    organization_id is not null
    and public.has_org_role(organization_id, array['owner','admin','tech'])
  );

-- device_intake_reports ───────────────────────────────────────────────────────
drop policy if exists device_intake_reports_select_policy on public.device_intake_reports;
drop policy if exists device_intake_reports_insert_policy on public.device_intake_reports;

drop policy if exists intake_reports_staff_select on public.device_intake_reports;
drop policy if exists intake_reports_staff_manage on public.device_intake_reports;
create policy intake_reports_staff_select on public.device_intake_reports
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy intake_reports_staff_manage on public.device_intake_reports
  for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

-- quote_request_photos ────────────────────────────────────────────────────────
drop policy if exists quote_request_photos_select_policy on public.quote_request_photos;

drop policy if exists photos_staff_select on public.quote_request_photos;
drop policy if exists photos_service_insert on public.quote_request_photos;
create policy photos_staff_select on public.quote_request_photos
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy photos_service_insert on public.quote_request_photos
  for insert to service_role with check (true); -- only service_role may insert (public quote form)

-- customer_addresses ──────────────────────────────────────────────────────────
drop policy if exists customer_addresses_select_policy on public.customer_addresses;
drop policy if exists customer_addresses_insert_policy on public.customer_addresses;

drop policy if exists customer_addresses_staff_select on public.customer_addresses;
drop policy if exists customer_addresses_staff_manage on public.customer_addresses;
create policy customer_addresses_staff_select on public.customer_addresses
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy customer_addresses_staff_manage on public.customer_addresses
  for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));

-- quote_estimate_items ────────────────────────────────────────────────────────
drop policy if exists quote_estimate_items_select_policy on public.quote_estimate_items;

drop policy if exists estimate_items_staff_select on public.quote_estimate_items;
drop policy if exists estimate_items_staff_manage on public.quote_estimate_items;
create policy estimate_items_staff_select on public.quote_estimate_items
  for select to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy estimate_items_staff_manage on public.quote_estimate_items
  for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin','tech']))
  with check (public.has_org_role(organization_id, array['owner','admin','tech']));
