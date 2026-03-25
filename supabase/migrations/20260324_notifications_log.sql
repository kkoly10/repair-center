create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  channel text not null default 'email',
  quote_request_id uuid null references public.quote_requests(id) on delete set null,
  repair_order_id uuid null references public.repair_orders(id) on delete set null,
  payment_id uuid null references public.payments(id) on delete set null,
  recipient_email text not null,
  subject text null,
  status text not null default 'queued',
  provider text null,
  provider_message_id text null,
  dedupe_key text null unique,
  payload jsonb not null default '{}'::jsonb,
  error_message text null,
  sent_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_quote_request_idx
  on public.notifications (quote_request_id, created_at desc);

create index if not exists notifications_repair_order_idx
  on public.notifications (repair_order_id, created_at desc);

create index if not exists notifications_payment_idx
  on public.notifications (payment_id, created_at desc);

create index if not exists notifications_event_key_idx
  on public.notifications (event_key, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_service_role_all
  on public.notifications
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.set_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_notifications_updated_at();
