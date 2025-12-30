-- OPTIMIZATION & REFACTORING SCRIPT
-- 1. Fixes Roles (Providers were stuck as 'members')
-- 2. Adds Performance Indexes
-- 3. Cleans up legacy/duplicate data

BEGIN;

-- [fix-roles] Ensure Token Aliases map to the correct Role
UPDATE public.users SET role = 'provider' WHERE token_alias LIKE 'DOC-%';
UPDATE public.users SET role = 'admin' WHERE token_alias LIKE 'COMMAND-%' OR token_alias LIKE 'CMD-%';
UPDATE public.users SET role = 'member' WHERE token_alias LIKE 'PATIENT-%' OR token_alias LIKE 'SARAH';

-- [fix-service-types] Ensure Service Types are standard
UPDATE public.users SET service_type = 'MH_GREEN' WHERE token_alias = 'DOC-MH';
UPDATE public.users SET service_type = 'FH_RED' WHERE token_alias = 'DOC-FAM';
UPDATE public.users SET service_type = 'PT_BLUE' WHERE token_alias = 'DOC-PT';

-- [optimization] Add Indexes for Schedule & Analytics queries
CREATE INDEX IF NOT EXISTS idx_appointments_provider_start ON appointments(provider_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_member_start ON appointments(member_id, start_time);
CREATE INDEX IF NOT EXISTS idx_slots_provider_start ON slots(provider_id, start_time);
CREATE INDEX IF NOT EXISTS idx_users_token_alias ON public.users(token_alias);

-- [cleanup] Remove the @example.com duplicates if @sector.mil exists
-- (This ensures we don't have two 'DOC-MH' users)
DELETE FROM auth.users 
WHERE email LIKE '%@example.com' 
AND EXISTS (
    SELECT 1 FROM auth.users u2 WHERE u2.email LIKE '%@sector.mil'
);

COMMIT;
