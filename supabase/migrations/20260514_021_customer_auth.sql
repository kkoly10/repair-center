-- Sprint 28: Customer account auth
-- Drop the global UNIQUE constraint on customers.auth_user_id (one user could only
-- ever have one customer record across all orgs — wrong for multi-tenant).
-- Replace with a composite unique (auth_user_id, organization_id) so one auth user
-- can have exactly one customer row per org.

-- 1. Drop the inline column-level UNIQUE (auto-named customers_auth_user_id_key).
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_auth_user_id_key;

-- 2. Add composite unique. Safe because the old constraint was globally unique,
--    so no two existing rows share the same (auth_user_id, organization_id) pair.
ALTER TABLE public.customers
  ADD CONSTRAINT customers_auth_user_id_org_unique
  UNIQUE (auth_user_id, organization_id);

-- 3. Customer self-service SELECT policy (additive alongside existing staff policy).
--    Logged-in customers can read their own rows by auth_user_id.
DROP POLICY IF EXISTS customers_self_select ON public.customers;
CREATE POLICY customers_self_select ON public.customers
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
