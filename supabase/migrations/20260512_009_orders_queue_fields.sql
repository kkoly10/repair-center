-- Sprint 8: repair queue fields
-- Adds priority and due_at to repair_orders for queue management.
-- Adds repair_order_audit_log for non-status change history
-- (status changes are already captured by the repair_order_status_history trigger).

alter table public.repair_orders
  add column if not exists priority text not null default 'normal';

alter table public.repair_orders
  drop constraint if exists repair_orders_priority_check;

alter table public.repair_orders
  add constraint repair_orders_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

alter table public.repair_orders
  add column if not exists due_at timestamptz;

create index if not exists idx_repair_orders_priority
  on public.repair_orders(priority);

create index if not exists idx_repair_orders_due_at
  on public.repair_orders(due_at);

create index if not exists idx_repair_orders_org_status
  on public.repair_orders(organization_id, current_status);

-- Audit log for queue quick-actions (technician, priority, due date changes).
-- Keyed to the org so RLS can scope reads without crossing tenants.
create table if not exists public.repair_order_audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  repair_order_id uuid not null references public.repair_orders(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_repair_order_id
  on public.repair_order_audit_log(repair_order_id);

create index if not exists idx_audit_log_organization_id
  on public.repair_order_audit_log(organization_id);

alter table public.repair_order_audit_log enable row level security;

drop policy if exists audit_log_staff_select on public.repair_order_audit_log;
create policy audit_log_staff_select on public.repair_order_audit_log
  for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists audit_log_service_insert on public.repair_order_audit_log;
create policy audit_log_service_insert on public.repair_order_audit_log
  for insert to service_role
  with check (true);
