-- Migration 004: Enforce NOT NULL on organization_id for child tables.
--
-- Run ONLY after all write paths have been updated to set organization_id
-- (Sprint 2 code changes). The NOT NULL constraints will fail if any row
-- still has organization_id = NULL.
--
-- Verify first:
--   select count(*) from public.payments where organization_id is null;
--   select count(*) from public.repair_messages where organization_id is null;
--   select count(*) from public.shipments where organization_id is null;
--   select count(*) from public.notifications where organization_id is null;
--   select count(*) from public.repair_order_status_history where organization_id is null;
--   select count(*) from public.device_intake_reports where organization_id is null;
--   select count(*) from public.quote_request_photos where organization_id is null;
--   select count(*) from public.customer_addresses where organization_id is null;
--   select count(*) from public.quote_estimate_items where organization_id is null;
-- All should return 0 before running this migration.

alter table public.payments
  alter column organization_id set not null;

alter table public.repair_messages
  alter column organization_id set not null;

alter table public.shipments
  alter column organization_id set not null;

alter table public.notifications
  alter column organization_id set not null;

alter table public.repair_order_status_history
  alter column organization_id set not null;

alter table public.device_intake_reports
  alter column organization_id set not null;

alter table public.quote_request_photos
  alter column organization_id set not null;

alter table public.customer_addresses
  alter column organization_id set not null;

alter table public.quote_estimate_items
  alter column organization_id set not null;
