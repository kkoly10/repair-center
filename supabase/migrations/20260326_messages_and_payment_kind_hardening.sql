alter table public.repair_messages
  add column if not exists staff_read_at timestamptz,
  add column if not exists customer_read_at timestamptz;

create index if not exists idx_repair_messages_staff_read_at
  on public.repair_messages (repair_order_id, staff_read_at);

create index if not exists idx_repair_messages_customer_read_at
  on public.repair_messages (repair_order_id, customer_read_at);

alter table public.payments
  drop constraint if exists payments_payment_kind_check;

alter table public.payments
  add constraint payments_payment_kind_check
  check (payment_kind in ('inspection_deposit', 'repair_balance', 'final_balance', 'refund', 'other'));
