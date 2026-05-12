-- The original pricing_rules table had a global unique constraint on
-- (model_id, repair_type_id), which means only one rule could exist per
-- model+repair pair across ALL organizations.  For multi-tenant operation
-- each org needs its own independent pricing rules for the same catalog
-- entries.  Drop the global constraint and replace it with a per-org one.

alter table public.pricing_rules
  drop constraint if exists pricing_rules_unique_model_repair;

alter table public.pricing_rules
  add constraint pricing_rules_unique_org_model_repair
  unique (organization_id, model_id, repair_type_id);
