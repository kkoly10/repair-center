-- Sprint 17: internal staff notes on repair orders
ALTER TABLE public.repair_orders
  ADD COLUMN IF NOT EXISTS notes text;
