-- REPAIR BROKEN AUTH TRIGGER
-- Fixes "Database error creating new user" by replacing the crashing trigger 
-- with a robust version that correctly syncs auth.users to public.users.

-- 1. Drop the potential crashing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Redefine the Handler Function (Safe & Schema-Aware)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, status, token_alias, service_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'member'),
    'active',
    COALESCE(new.raw_user_meta_data->>'token_alias', 'UNKNOWN'),
    COALESCE(new.raw_user_meta_data->>'service_type', 'ALL')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
     role = EXCLUDED.role,
     status = EXCLUDED.status;
     -- We don't overwrite alias/service on conflict to be safe
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-Attach the Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
