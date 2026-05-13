-- Sprint 23: Appointment scheduling
-- Customers book drop-off appointments through the public shop page.
-- Admins confirm, cancel, or convert appointments to repair orders.

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'no_show',
  'converted'
);

create table if not exists public.appointments (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  -- customer info (guest or linked)
  customer_id         uuid references public.customers(id) on delete set null,
  first_name          text not null,
  last_name           text,
  email               text not null,
  phone               text,
  -- device & repair
  brand_name          text,
  model_name          text,
  repair_description  text,
  -- scheduling
  preferred_at        timestamptz not null,
  notes               text,
  -- lifecycle
  status              public.appointment_status not null default 'pending',
  confirmed_at        timestamptz,
  cancelled_at        timestamptz,
  cancellation_reason text,
  -- if converted to a repair order/quote
  quote_request_id    uuid references public.quote_requests(id) on delete set null,
  -- meta
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists appointments_org_preferred_idx
  on public.appointments(organization_id, preferred_at desc);

create index if not exists appointments_org_status_idx
  on public.appointments(organization_id, status);

-- RLS
alter table public.appointments enable row level security;

create policy "appointments_staff_all"
  on public.appointments
  for all
  to authenticated
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- updated_at trigger (reuse existing helper if present, else simple trigger)
create or replace function public.set_appointments_updated_at()
returns trigger language plpgsql security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_appointments_updated_at();
