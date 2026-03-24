-- Add beyond_economical_repair and no_fault_found statuses to repair_orders
alter table public.repair_orders
  drop constraint if exists repair_orders_current_status_check;

alter table public.repair_orders
  add constraint repair_orders_current_status_check check (
    current_status in (
      'awaiting_mail_in',
      'in_transit_to_shop',
      'received',
      'inspection',
      'awaiting_final_approval',
      'approved',
      'waiting_parts',
      'repairing',
      'testing',
      'awaiting_balance_payment',
      'ready_to_ship',
      'shipped',
      'delivered',
      'cancelled',
      'declined',
      'returned_unrepaired',
      'beyond_economical_repair',
      'no_fault_found'
    )
  );

-- Add expires_at to quote_estimates so estimates can be time-bounded
alter table public.quote_estimates
  add column if not exists expires_at timestamptz;

-- Add technician_note to repair_orders for internal tech findings
alter table public.repair_orders
  add column if not exists technician_note text;
