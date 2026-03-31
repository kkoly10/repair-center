create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limits_ip_created on public.rate_limits (ip_address, created_at desc);

-- Auto-cleanup: delete entries older than 2 hours
create or replace function cleanup_old_rate_limits() returns void as $$
  delete from public.rate_limits where created_at < now() - interval '2 hours';
$$ language sql;
