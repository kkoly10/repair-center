-- Fix infinite RLS recursion caused by is_staff(), is_admin(), and current_user_role()
-- querying public.profiles without SECURITY DEFINER, while profiles itself has an RLS
-- policy that calls is_staff() — creating an infinite recursive loop.
--
-- Adding SECURITY DEFINER makes these functions execute as the function owner (postgres),
-- bypassing RLS when reading profiles. SET search_path = public prevents search_path
-- injection attacks on security definer functions.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;
