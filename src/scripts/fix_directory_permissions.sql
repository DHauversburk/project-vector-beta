-- Fix RLS Policies to ensure Admin can view/edit User Directory
-- Wrapped in DO block to prevent syntax errors

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clear old policies to prevent conflicts (Wrapped in PL/pgSQL block)
DO $$ 
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
    DROP POLICY IF EXISTS "Policy for Admin" ON public.users;
    DROP POLICY IF EXISTS "Allow Reader" ON public.users;
    DROP POLICY IF EXISTS "Allow Self Update" ON public.users;
    DROP POLICY IF EXISTS "Allow Admin Full" ON public.users;
  EXCEPTION WHEN OTHERS THEN 
    NULL; -- Ignore cleanup errors
  END;
END $$;

-- 1. READ: Allow any authenticated user to read the directory (Required for Token Station & Linking)
CREATE POLICY "Allow Reader" ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. UPDATE: Allow users to update their own profile (e.g. settings)
CREATE POLICY "Allow Self Update" ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 3. ADMIN FULL ACCESS: Allow Admins to Delete/Update anyone
CREATE POLICY "Allow Admin Full" ON public.users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR token_alias ILIKE 'COMMAND%' OR token_alias = 'admin')
    )
);
