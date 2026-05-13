-- Sprint 20: customer reviews submitted via post-repair follow-up emails
create table if not exists public.repair_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  repair_order_id uuid references public.repair_orders(id) on delete set null,
  rating integer not null constraint repair_reviews_rating_check check (rating between 1 and 5),
  comment text,
  source text not null default 'email_link'
    constraint repair_reviews_source_check check (source in ('email_link', 'web', 'manual')),
  created_at timestamptz not null default now(),
  constraint repair_reviews_unique_quote unique (quote_request_id)
);

create index if not exists idx_repair_reviews_org_id on public.repair_reviews(organization_id);
create index if not exists idx_repair_reviews_created_at on public.repair_reviews(organization_id, created_at desc);

alter table public.repair_reviews enable row level security;

drop policy if exists repair_reviews_org_select on public.repair_reviews;
create policy repair_reviews_org_select on public.repair_reviews
  for select using (is_org_member(organization_id));
