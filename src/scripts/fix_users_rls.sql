-- FIX USERS TABLE RLS POLICIES
-- Run this in your Supabase SQL Editor

-- 1. First, disable RLS temporarily to fix it
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Drop any problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "allow_self_read" ON public.users;
DROP POLICY IF EXISTS "allow_self_update" ON public.users;
DROP POLICY IF EXISTS "allow_admin_all" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- 3. Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, non-recursive policies

-- Allow users to read their own profile
CREATE POLICY "users_read_own"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile  
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Allow service role to do anything (for admin operations)
CREATE POLICY "service_role_all"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Allow authenticated users to read provider profiles (for booking)
CREATE POLICY "read_providers"
ON public.users
FOR SELECT
USING (role = 'provider');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;

SELECT 'RLS policies fixed!' as result;
