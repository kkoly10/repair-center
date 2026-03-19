create extension if not exists pgcrypto;

create sequence if not exists public.repair_quote_seq start 1000;
create sequence if not exists public.repair_order_seq start 1000;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_quote_id()
returns text
language plpgsql
as $$
declare
  next_id bigint;
begin
  next_id := nextval('public.repair_quote_seq');
  return 'RCQ-' || lpad(next_id::text, 6, '0');
end;
$$;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  next_id bigint;
begin
  next_id := nextval('public.repair_order_seq');
  return 'RCO-' || lpad(next_id::text, 6, '0');
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('customer', 'tech', 'admin'))
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  preferred_contact_method text not null default 'either',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_preferred_contact_method_check check (preferred_contact_method in ('email', 'text', 'either'))
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  address_type text not null default 'shipping',
  full_name text,
  company text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_address_type_check check (address_type in ('shipping', 'billing', 'other'))
);

create table if not exists public.repair_catalog_brands (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  brand_name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repair_catalog_brands_category_check check (category in ('phone', 'tablet', 'laptop', 'desktop'))
);

create table if not exists public.repair_catalog_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.repair_catalog_brands(id) on delete cascade,
  category text not null,
  family_name text,
  model_name text not null,
  model_key text not null unique,
  model_year integer,
  active boolean not null default true,
  supports_screen boolean not null default false,
  supports_battery boolean not null default false,
  supports_charging boolean not null default false,
  supports_keyboard boolean not null default false,
  supports_software boolean not null default true,
  quote_only_flags text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repair_catalog_models_category_check check (category in ('phone', 'tablet', 'laptop', 'desktop'))
);

create table if not exists public.repair_types (
  id uuid primary key default gen_random_uuid(),
  repair_key text not null unique,
  repair_name text not null,
  category text,
  price_mode_default text not null default 'range',
  requires_parts boolean not null default true,
  requires_manual_review_by_default boolean not null default false,
  warranty_days_default integer not null default 90,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repair_types_category_check check (category is null or category in ('phone', 'tablet', 'laptop', 'desktop')),
  constraint repair_types_price_mode_default_check check (price_mode_default in ('fixed', 'range', 'manual'))
);

create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.repair_catalog_models(id) on delete cascade,
  repair_type_id uuid not null references public.repair_types(id) on delete cascade,
  price_mode text not null,
  part_grade text,
  part_cost numeric(10,2),
  labor_base numeric(10,2) not null default 0,
  complexity_fee numeric(10,2) not null default 0,
  risk_buffer numeric(10,2) not null default 0,
  markup_amount numeric(10,2) not null default 0,
  public_price_fixed numeric(10,2),
  public_price_min numeric(10,2),
  public_price_max numeric(10,2),
  deposit_amount numeric(10,2) not null default 0,
  return_shipping_fee numeric(10,2) not null default 0,
  turnaround_min_business_days integer,
  turnaround_max_business_days integer,
  warranty_days integer not null default 90,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_rules_price_mode_check check (price_mode in ('fixed', 'range', 'manual')),
  constraint pricing_rules_unique_model_repair unique (model_id, repair_type_id)
);

create table if not exists public.pricing_rule_conditions (
  id uuid primary key default gen_random_uuid(),
  pricing_rule_id uuid not null references public.pricing_rules(id) on delete cascade,
  condition_key text not null,
  condition_value text,
  price_adjustment_type text not null default 'fixed_delta',
  price_adjustment_amount numeric(10,2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_rule_conditions_price_adjustment_type_check check (price_adjustment_type in ('fixed_delta', 'percent_delta', 'force_manual_review'))
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  quote_id text not null unique default public.generate_quote_id(),
  customer_id uuid references public.customers(id) on delete set null,
  guest_email text,
  guest_phone text,
  first_name text,
  last_name text,
  preferred_contact_method text not null default 'either',
  device_category text not null,
  brand_name text,
  model_name text,
  model_key text,
  repair_type_key text,
  issue_description text,
  powers_on text,
  charges text,
  liquid_damage text,
  prior_repairs text,
  preserve_data text,
  submission_source text not null default 'web',
  status text not null default 'submitted',
  selected_pricing_rule_id uuid references public.pricing_rules(id) on delete set null,
  preliminary_price_fixed numeric(10,2),
  preliminary_price_min numeric(10,2),
  preliminary_price_max numeric(10,2),
  quote_summary text,
  internal_notes text,
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_requests_device_category_check check (device_category in ('phone', 'tablet', 'laptop', 'desktop')),
  constraint quote_requests_preferred_contact_method_check check (preferred_contact_method in ('email', 'text', 'either')),
  constraint quote_requests_status_check check (status in ('submitted', 'under_review', 'estimate_sent', 'awaiting_customer', 'approved_for_mail_in', 'declined', 'archived')),
  constraint quote_requests_power_state_check check (powers_on is null or powers_on in ('Yes', 'No', 'Not sure')),
  constraint quote_requests_charge_state_check check (charges is null or charges in ('Yes', 'No', 'Not sure')),
  constraint quote_requests_liquid_state_check check (liquid_damage is null or liquid_damage in ('Yes', 'No', 'Not sure')),
  constraint quote_requests_prior_repairs_check check (prior_repairs is null or prior_repairs in ('Yes', 'No', 'Not sure')),
  constraint quote_requests_preserve_data_check check (preserve_data is null or preserve_data in ('Yes', 'No', 'Not sure'))
);

create table if not exists public.quote_request_photos (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  storage_path text not null,
  photo_type text,
  sort_order integer not null default 0,
  uploaded_by_customer boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_estimates (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  estimate_kind text not null default 'preliminary',
  status text not null default 'draft',
  subtotal_amount numeric(10,2) not null default 0,
  shipping_amount numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  deposit_credit_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  warranty_days integer,
  turnaround_note text,
  customer_visible_notes text,
  internal_notes text,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  approved_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_estimates_estimate_kind_check check (estimate_kind in ('preliminary', 'final', 'revised')),
  constraint quote_estimates_status_check check (status in ('draft', 'sent', 'approved', 'declined', 'superseded'))
);

create table if not exists public.quote_estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.quote_estimates(id) on delete cascade,
  line_type text not null default 'labor',
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_amount numeric(10,2) not null default 0,
  line_total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_estimate_items_line_type_check check (line_type in ('labor', 'part', 'shipping', 'discount', 'fee', 'credit'))
);

create table if not exists public.repair_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.generate_order_number(),
  quote_request_id uuid not null unique references public.quote_requests(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  model_id uuid references public.repair_catalog_models(id) on delete set null,
  repair_type_id uuid references public.repair_types(id) on delete set null,
  current_status text not null default 'awaiting_mail_in',
  inspection_deposit_required numeric(10,2) not null default 0,
  inspection_deposit_paid_at timestamptz,
  final_estimate_id uuid references public.quote_estimates(id) on delete set null,
  assigned_technician_user_id uuid references public.profiles(id) on delete set null,
  intake_received_at timestamptz,
  repair_started_at timestamptz,
  repair_completed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repair_orders_current_status_check check (current_status in ('awaiting_mail_in', 'in_transit_to_shop', 'received', 'inspection', 'awaiting_final_approval', 'approved', 'waiting_parts', 'repairing', 'testing', 'awaiting_balance_payment', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'declined', 'returned_unrepaired'))
);

create table if not exists public.device_intake_reports (
  id uuid primary key default gen_random_uuid(),
  repair_order_id uuid not null unique references public.repair_orders(id) on delete cascade,
  package_condition text,
  device_condition text,
  included_items text,
  imei_or_serial text,
  power_test_result text,
  intake_photos_complete boolean not null default false,
  hidden_damage_found boolean not null default false,
  liquid_damage_found boolean not null default false,
  board_damage_found boolean not null default false,
  notes text,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_order_status_history (
  id uuid primary key default gen_random_uuid(),
  repair_order_id uuid not null references public.repair_orders(id) on delete cascade,
  previous_status text,
  new_status text not null,
  customer_visible boolean not null default true,
  note text,
  changed_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.repair_messages (
  id uuid primary key default gen_random_uuid(),
  repair_order_id uuid not null references public.repair_orders(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete set null,
  sender_customer_id uuid references public.customers(id) on delete set null,
  sender_role text not null,
  body text not null,
  internal_only boolean not null default false,
  created_at timestamptz not null default now(),
  constraint repair_messages_sender_role_check check (sender_role in ('customer', 'tech', 'admin', 'system'))
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  repair_order_id uuid not null references public.repair_orders(id) on delete cascade,
  shipment_type text not null,
  carrier text,
  service_level text,
  tracking_number text,
  tracking_url text,
  shipping_label_url text,
  status text,
  insured_value numeric(10,2),
  shipped_at timestamptz,
  delivered_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipments_shipment_type_check check (shipment_type in ('inbound', 'return'))
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  repair_order_id uuid not null references public.repair_orders(id) on delete cascade,
  quote_estimate_id uuid references public.quote_estimates(id) on delete set null,
  payment_kind text not null,
  provider text not null default 'stripe',
  provider_payment_intent_id text,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending',
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_payment_kind_check check (payment_kind in ('inspection_deposit', 'repair_balance', 'refund', 'other')),
  constraint payments_provider_check check (provider in ('stripe', 'manual', 'other')),
  constraint payments_status_check check (status in ('pending', 'authorized', 'paid', 'failed', 'refunded', 'cancelled'))
);

create index if not exists idx_customers_auth_user_id on public.customers(auth_user_id);
create index if not exists idx_customers_email on public.customers(lower(email));
create index if not exists idx_customer_addresses_customer_id on public.customer_addresses(customer_id);
create index if not exists idx_repair_catalog_brands_category on public.repair_catalog_brands(category);
create index if not exists idx_repair_catalog_models_brand_id on public.repair_catalog_models(brand_id);
create index if not exists idx_repair_catalog_models_model_key on public.repair_catalog_models(model_key);
create index if not exists idx_pricing_rules_model_id on public.pricing_rules(model_id);
create index if not exists idx_pricing_rules_repair_type_id on public.pricing_rules(repair_type_id);
create index if not exists idx_quote_requests_customer_id on public.quote_requests(customer_id);
create index if not exists idx_quote_requests_quote_id on public.quote_requests(quote_id);
create index if not exists idx_quote_requests_status on public.quote_requests(status);
create index if not exists idx_quote_request_photos_quote_request_id on public.quote_request_photos(quote_request_id);
create index if not exists idx_quote_estimates_quote_request_id on public.quote_estimates(quote_request_id);
create index if not exists idx_repair_orders_customer_id on public.repair_orders(customer_id);
create index if not exists idx_repair_orders_status on public.repair_orders(current_status);
create index if not exists idx_repair_orders_order_number on public.repair_orders(order_number);
create index if not exists idx_repair_order_status_history_order_id on public.repair_order_status_history(repair_order_id);
create index if not exists idx_repair_messages_order_id on public.repair_messages(repair_order_id);
create index if not exists idx_shipments_order_id on public.shipments(repair_order_id);
create index if not exists idx_payments_order_id on public.payments(repair_order_id);

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'tech')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.log_repair_order_status_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.repair_order_status_history (
      repair_order_id,
      previous_status,
      new_status,
      customer_visible,
      note,
      changed_by_user_id
    )
    values (
      new.id,
      null,
      new.current_status,
      true,
      'Initial order status',
      auth.uid()
    );
    return new;
  end if;

  if old.current_status is distinct from new.current_status then
    insert into public.repair_order_status_history (
      repair_order_id,
      previous_status,
      new_status,
      customer_visible,
      note,
      changed_by_user_id
    )
    values (
      new.id,
      old.current_status,
      new.current_status,
      true,
      null,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();

drop trigger if exists trg_customer_addresses_updated_at on public.customer_addresses;
create trigger trg_customer_addresses_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_catalog_brands_updated_at on public.repair_catalog_brands;
create trigger trg_repair_catalog_brands_updated_at before update on public.repair_catalog_brands for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_catalog_models_updated_at on public.repair_catalog_models;
create trigger trg_repair_catalog_models_updated_at before update on public.repair_catalog_models for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_types_updated_at on public.repair_types;
create trigger trg_repair_types_updated_at before update on public.repair_types for each row execute function public.set_updated_at();

drop trigger if exists trg_pricing_rules_updated_at on public.pricing_rules;
create trigger trg_pricing_rules_updated_at before update on public.pricing_rules for each row execute function public.set_updated_at();

drop trigger if exists trg_pricing_rule_conditions_updated_at on public.pricing_rule_conditions;
create trigger trg_pricing_rule_conditions_updated_at before update on public.pricing_rule_conditions for each row execute function public.set_updated_at();

drop trigger if exists trg_quote_requests_updated_at on public.quote_requests;
create trigger trg_quote_requests_updated_at before update on public.quote_requests for each row execute function public.set_updated_at();

drop trigger if exists trg_quote_estimates_updated_at on public.quote_estimates;
create trigger trg_quote_estimates_updated_at before update on public.quote_estimates for each row execute function public.set_updated_at();

drop trigger if exists trg_quote_estimate_items_updated_at on public.quote_estimate_items;
create trigger trg_quote_estimate_items_updated_at before update on public.quote_estimate_items for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_orders_updated_at on public.repair_orders;
create trigger trg_repair_orders_updated_at before update on public.repair_orders for each row execute function public.set_updated_at();

drop trigger if exists trg_device_intake_reports_updated_at on public.device_intake_reports;
create trigger trg_device_intake_reports_updated_at before update on public.device_intake_reports for each row execute function public.set_updated_at();

drop trigger if exists trg_shipments_updated_at on public.shipments;
create trigger trg_shipments_updated_at before update on public.shipments for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_orders_status_history on public.repair_orders;
create trigger trg_repair_orders_status_history
after insert or update on public.repair_orders
for each row execute function public.log_repair_order_status_change();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.repair_catalog_brands enable row level security;
alter table public.repair_catalog_models enable row level security;
alter table public.repair_types enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.pricing_rule_conditions enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_request_photos enable row level security;
alter table public.quote_estimates enable row level security;
alter table public.quote_estimate_items enable row level security;
alter table public.repair_orders enable row level security;
alter table public.device_intake_reports enable row level security;
alter table public.repair_order_status_history enable row level security;
alter table public.repair_messages enable row level security;
alter table public.shipments enable row level security;
alter table public.payments enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (id = auth.uid() or public.is_staff())
with check (id = auth.uid() or public.is_staff());

drop policy if exists customers_select_policy on public.customers;
create policy customers_select_policy on public.customers
for select using (public.is_staff() or auth_user_id = auth.uid());

drop policy if exists customers_insert_policy on public.customers;
create policy customers_insert_policy on public.customers
for insert with check (public.is_staff() or auth_user_id = auth.uid());

drop policy if exists customers_update_policy on public.customers;
create policy customers_update_policy on public.customers
for update using (public.is_staff() or auth_user_id = auth.uid())
with check (public.is_staff() or auth_user_id = auth.uid());

drop policy if exists customer_addresses_select_policy on public.customer_addresses;
create policy customer_addresses_select_policy on public.customer_addresses
for select using (
  public.is_staff() or exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists customer_addresses_insert_policy on public.customer_addresses;
create policy customer_addresses_insert_policy on public.customer_addresses
for insert with check (
  public.is_staff() or exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists customer_addresses_update_policy on public.customer_addresses;
create policy customer_addresses_update_policy on public.customer_addresses
for update using (
  public.is_staff() or exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.auth_user_id = auth.uid()
  )
)
with check (
  public.is_staff() or exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists repair_catalog_brands_public_select on public.repair_catalog_brands;
create policy repair_catalog_brands_public_select on public.repair_catalog_brands
for select to anon, authenticated using (true);

drop policy if exists repair_catalog_brands_staff_write on public.repair_catalog_brands;
create policy repair_catalog_brands_staff_write on public.repair_catalog_brands
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists repair_catalog_models_public_select on public.repair_catalog_models;
create policy repair_catalog_models_public_select on public.repair_catalog_models
for select to anon, authenticated using (true);

drop policy if exists repair_catalog_models_staff_write on public.repair_catalog_models;
create policy repair_catalog_models_staff_write on public.repair_catalog_models
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists repair_types_public_select on public.repair_types;
create policy repair_types_public_select on public.repair_types
for select to anon, authenticated using (true);

drop policy if exists repair_types_staff_write on public.repair_types;
create policy repair_types_staff_write on public.repair_types
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists pricing_rules_public_select on public.pricing_rules;
create policy pricing_rules_public_select on public.pricing_rules
for select to anon, authenticated using (true);

drop policy if exists pricing_rules_staff_write on public.pricing_rules;
create policy pricing_rules_staff_write on public.pricing_rules
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists pricing_rule_conditions_staff_only on public.pricing_rule_conditions;
create policy pricing_rule_conditions_staff_only on public.pricing_rule_conditions
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists quote_requests_select_policy on public.quote_requests;
create policy quote_requests_select_policy on public.quote_requests
for select using (
  public.is_staff() or exists (
    select 1 from public.customers c
    where c.id = quote_requests.customer_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists quote_requests_insert_policy on public.quote_requests;
create policy quote_requests_insert_policy on public.quote_requests
for insert with check (
  public.is_staff() or exists (
    select 1 from public.customers c
    where c.id = quote_requests.customer_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists quote_requests_update_policy on public.quote_requests;
create policy quote_requests_update_policy on public.quote_requests
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists quote_request_photos_select_policy on public.quote_request_photos;
create policy quote_request_photos_select_policy on public.quote_request_photos
for select using (
  public.is_staff() or exists (
    select 1
    from public.quote_requests qr
    join public.customers c on c.id = qr.customer_id
    where qr.id = quote_request_photos.quote_request_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists quote_request_photos_insert_policy on public.quote_request_photos;
create policy quote_request_photos_insert_policy on public.quote_request_photos
for insert with check (
  public.is_staff() or exists (
    select 1
    from public.quote_requests qr
    join public.customers c on c.id = qr.customer_id
    where qr.id = quote_request_photos.quote_request_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists quote_request_photos_update_policy on public.quote_request_photos;
create policy quote_request_photos_update_policy on public.quote_request_photos
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists quote_estimates_select_policy on public.quote_estimates;
create policy quote_estimates_select_policy on public.quote_estimates
for select using (
  public.is_staff() or exists (
    select 1
    from public.quote_requests qr
    join public.customers c on c.id = qr.customer_id
    where qr.id = quote_estimates.quote_request_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists quote_estimates_insert_policy on public.quote_estimates;
create policy quote_estimates_insert_policy on public.quote_estimates
for insert with check (public.is_staff());

drop policy if exists quote_estimates_update_policy on public.quote_estimates;
create policy quote_estimates_update_policy on public.quote_estimates
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists quote_estimate_items_select_policy on public.quote_estimate_items;
create policy quote_estimate_items_select_policy on public.quote_estimate_items
for select using (
  public.is_staff() or exists (
    select 1
    from public.quote_estimates qe
    join public.quote_requests qr on qr.id = qe.quote_request_id
    join public.customers c on c.id = qr.customer_id
    where qe.id = quote_estimate_items.estimate_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists quote_estimate_items_insert_policy on public.quote_estimate_items;
create policy quote_estimate_items_insert_policy on public.quote_estimate_items
for insert with check (public.is_staff());

drop policy if exists quote_estimate_items_update_policy on public.quote_estimate_items;
create policy quote_estimate_items_update_policy on public.quote_estimate_items
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists repair_orders_select_policy on public.repair_orders;
create policy repair_orders_select_policy on public.repair_orders
for select using (
  public.is_staff() or exists (
    select 1 from public.customers c
    where c.id = repair_orders.customer_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists repair_orders_insert_policy on public.repair_orders;
create policy repair_orders_insert_policy on public.repair_orders
for insert with check (public.is_staff());

drop policy if exists repair_orders_update_policy on public.repair_orders;
create policy repair_orders_update_policy on public.repair_orders
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists device_intake_reports_staff_only on public.device_intake_reports;
create policy device_intake_reports_staff_only on public.device_intake_reports
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists repair_order_status_history_select_policy on public.repair_order_status_history;
create policy repair_order_status_history_select_policy on public.repair_order_status_history
for select using (
  public.is_staff() or (
    customer_visible = true and exists (
      select 1
      from public.repair_orders ro
      join public.customers c on c.id = ro.customer_id
      where ro.id = repair_order_status_history.repair_order_id
        and c.auth_user_id = auth.uid()
    )
  )
);

drop policy if exists repair_order_status_history_insert_policy on public.repair_order_status_history;
create policy repair_order_status_history_insert_policy on public.repair_order_status_history
for insert with check (public.is_staff());

drop policy if exists repair_messages_select_policy on public.repair_messages;
create policy repair_messages_select_policy on public.repair_messages
for select using (
  public.is_staff() or (
    internal_only = false and exists (
      select 1
      from public.repair_orders ro
      join public.customers c on c.id = ro.customer_id
      where ro.id = repair_messages.repair_order_id
        and c.auth_user_id = auth.uid()
    )
  )
);

drop policy if exists repair_messages_insert_policy on public.repair_messages;
create policy repair_messages_insert_policy on public.repair_messages
for insert with check (
  public.is_staff() or exists (
    select 1
    from public.repair_orders ro
    join public.customers c on c.id = ro.customer_id
    where ro.id = repair_messages.repair_order_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists shipments_select_policy on public.shipments;
create policy shipments_select_policy on public.shipments
for select using (
  public.is_staff() or exists (
    select 1
    from public.repair_orders ro
    join public.customers c on c.id = ro.customer_id
    where ro.id = shipments.repair_order_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists shipments_insert_policy on public.shipments;
create policy shipments_insert_policy on public.shipments
for insert with check (public.is_staff());

drop policy if exists shipments_update_policy on public.shipments;
create policy shipments_update_policy on public.shipments
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists payments_select_policy on public.payments;
create policy payments_select_policy on public.payments
for select using (
  public.is_staff() or exists (
    select 1
    from public.repair_orders ro
    join public.customers c on c.id = ro.customer_id
    where ro.id = payments.repair_order_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists payments_insert_policy on public.payments;
create policy payments_insert_policy on public.payments
for insert with check (public.is_staff());

drop policy if exists payments_update_policy on public.payments;
create policy payments_update_policy on public.payments
for update using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public)
values ('repair-uploads', 'repair-uploads', false)
on conflict (id) do nothing;

drop policy if exists repair_uploads_staff_select on storage.objects;
create policy repair_uploads_staff_select on storage.objects
for select to authenticated
using (bucket_id = 'repair-uploads' and public.is_staff());

drop policy if exists repair_uploads_staff_insert on storage.objects;
create policy repair_uploads_staff_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'repair-uploads' and public.is_staff());

drop policy if exists repair_uploads_staff_update on storage.objects;
create policy repair_uploads_staff_update on storage.objects
for update to authenticated
using (bucket_id = 'repair-uploads' and public.is_staff())
with check (bucket_id = 'repair-uploads' and public.is_staff());

drop policy if exists repair_uploads_staff_delete on storage.objects;
create policy repair_uploads_staff_delete on storage.objects
for delete to authenticated
using (bucket_id = 'repair-uploads' and public.is_staff());
