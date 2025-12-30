-- Restore Access (Nuclear Option)
-- Simplifies RLS to "All Authenticated Users have Full Access" 
-- This fixes the "Unknown Member" issue and "Directory Load" failure.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Drop All Known/Possible Policy Names
  BEGIN
      DROP POLICY IF EXISTS "Allow Reader" ON public.users;
      DROP POLICY IF EXISTS "Allow Admin Full" ON public.users;
      DROP POLICY IF EXISTS "Allow Self Update" ON public.users;
      DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
      DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
      DROP POLICY IF EXISTS "Policy for Admin" ON public.users;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Create Single Permissive Policy
CREATE POLICY "Universal Access" ON public.users FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
