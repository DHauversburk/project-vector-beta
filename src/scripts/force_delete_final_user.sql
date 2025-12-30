-- FORCE DELETE FINAL USER
-- Surgically removes doc.mh.final@gmail.com to fix the "Database error loading user" state.
-- Handles constraints by deleting dependents first.

BEGIN;
  -- 1. Get the ID for this user
  -- (We use a CTE/Subquery to be safe)
  
  -- 2. Delete Appointments (Provider or Member)
  DELETE FROM appointments WHERE provider_id IN (SELECT id FROM auth.users WHERE email = 'doc.mh.final@gmail.com');
  DELETE FROM appointments WHERE member_id IN (SELECT id FROM auth.users WHERE email = 'doc.mh.final@gmail.com');

  -- 3. Delete Slots
  DELETE FROM slots WHERE provider_id IN (SELECT id FROM auth.users WHERE email = 'doc.mh.final@gmail.com');

  -- 4. Delete Resources
  DELETE FROM resources WHERE provider_id IN (SELECT id FROM auth.users WHERE email = 'doc.mh.final@gmail.com');

  -- 5. Delete from Public Users
  DELETE FROM public.users WHERE id IN (SELECT id FROM auth.users WHERE email = 'doc.mh.final@gmail.com');
  DELETE FROM public.users WHERE token_alias = 'DOC-MH'; -- Just in case of orphan

  -- 6. Delete from Auth Users (The blockage)
  DELETE FROM auth.users WHERE email = 'doc.mh.final@gmail.com';

COMMIT;
