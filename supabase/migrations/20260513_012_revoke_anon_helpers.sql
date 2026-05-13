-- Harden RLS helper functions: prevent the anon role from calling them via RPC.
-- PostgreSQL grants EXECUTE to PUBLIC by default on functions in public schema.
-- Revoking from anon stops unauthenticated callers from enumerating org membership
-- via the Supabase REST /rpc endpoint.
-- Note: SECURITY DEFINER functions used in RLS policies are invoked as the function
-- owner (postgres) regardless of caller role, so these REVOKEs do not break RLS.

REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id()          FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff()                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin()                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role()        FROM anon;
