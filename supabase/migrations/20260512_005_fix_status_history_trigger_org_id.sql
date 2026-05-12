-- Migration 005: Fix log_repair_order_status_change trigger to include organization_id.
--
-- Migration 004 added NOT NULL to repair_order_status_history.organization_id, but the
-- existing trigger function did not set it, causing all repair order status changes to fail.
-- The trigger has access to NEW.organization_id from the parent repair_orders row.

create or replace function public.log_repair_order_status_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.repair_order_status_history (
      organization_id,
      repair_order_id,
      previous_status,
      new_status,
      customer_visible,
      note,
      changed_by_user_id
    )
    values (
      new.organization_id,
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
      organization_id,
      repair_order_id,
      previous_status,
      new_status,
      customer_visible,
      note,
      changed_by_user_id
    )
    values (
      new.organization_id,
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
