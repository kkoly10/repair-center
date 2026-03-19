begin;

with ranked_conditions as (
  select
    id,
    row_number() over (
      partition by pricing_rule_id, condition_key, condition_value, price_adjustment_type
      order by created_at, id
    ) as rn
  from public.pricing_rule_conditions
)
delete from public.pricing_rule_conditions prc
using ranked_conditions rc
where prc.id = rc.id
  and rc.rn > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pricing_rule_conditions_unique_rule_condition'
      and conrelid = 'public.pricing_rule_conditions'::regclass
  ) then
    alter table public.pricing_rule_conditions
      add constraint pricing_rule_conditions_unique_rule_condition
      unique (pricing_rule_id, condition_key, condition_value, price_adjustment_type);
  end if;
end
$$;

commit;
