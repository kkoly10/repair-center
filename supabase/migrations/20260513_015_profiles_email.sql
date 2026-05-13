-- Sprint 16: add email to profiles so trial warning emails can reach org owners
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill from auth.users for all existing rows
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

-- Update the trigger so new signups automatically get email populated
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    'customer',
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email WHERE profiles.email IS NULL;

  RETURN NEW;
END;
$$;
