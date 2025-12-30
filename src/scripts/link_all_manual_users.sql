-- LINK ALL MANUAL USERS
-- Run this AFTER manually creating the users in Supabase Dashboard.
-- This assigns the correct Role, Token Alias, and Service Type to the new accounts.

-- 1. DOC-FAM (Red Team)
INSERT INTO public.users (id, token_alias, role, service_type, status)
SELECT id, 'DOC-FAM', 'provider', 'FH_RED', 'active'
FROM auth.users WHERE email = 'doc_fam@example.com'
ON CONFLICT (id) DO UPDATE SET 
  token_alias = 'DOC-FAM', role = 'provider', service_type = 'FH_RED';

-- 2. DOC-PT (Blue Team)
INSERT INTO public.users (id, token_alias, role, service_type, status)
SELECT id, 'DOC-PT', 'provider', 'PT_BLUE', 'active'
FROM auth.users WHERE email = 'doc_pt@example.com'
ON CONFLICT (id) DO UPDATE SET 
  token_alias = 'DOC-PT', role = 'provider', service_type = 'PT_BLUE';

-- 3. COMMAND-01 (Admin)
INSERT INTO public.users (id, token_alias, role, service_type, status)
SELECT id, 'COMMAND-01', 'admin', 'ALL', 'active'
FROM auth.users WHERE email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET 
  token_alias = 'COMMAND-01', role = 'admin', service_type = 'ALL';

-- 4. PATIENT-01
INSERT INTO public.users (id, token_alias, role, service_type, status)
SELECT id, 'PATIENT-01', 'member', 'ALL', 'active'
FROM auth.users WHERE email = 'patient01@example.com'
ON CONFLICT (id) DO UPDATE SET 
  token_alias = 'PATIENT-01', role = 'member', service_type = 'ALL';

-- 5. PATIENT-02
INSERT INTO public.users (id, token_alias, role, service_type, status)
SELECT id, 'PATIENT-02', 'member', 'ALL', 'active'
FROM auth.users WHERE email = 'patient02@example.com'
ON CONFLICT (id) DO UPDATE SET 
  token_alias = 'PATIENT-02', role = 'member', service_type = 'ALL';
