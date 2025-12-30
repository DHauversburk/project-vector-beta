-- NUCLEAR FIX V2 for DOC-MH (With Cascading Deletes)
-- Handles Foreign Key constraints by deleting appointments/slots first.

BEGIN;
  -- 1. Delete dependent Appointments (Provider)
  DELETE FROM appointments WHERE provider_id IN (
      SELECT id FROM public.users WHERE token_alias = 'DOC-MH'
  );
  -- Also delete if they were a member (just in case)
  DELETE FROM appointments WHERE member_id IN (
      SELECT id FROM public.users WHERE token_alias = 'DOC-MH'
  );

  -- 2. Delete dependent Slots
  DELETE FROM slots WHERE provider_id IN (
      SELECT id FROM public.users WHERE token_alias = 'DOC-MH'
  );

  -- 3. Delete dependent Resources
  DELETE FROM resources WHERE provider_id IN (
      SELECT id FROM public.users WHERE token_alias = 'DOC-MH'
  );

  -- 4. Delete the User Profile (Public)
  DELETE FROM public.users WHERE token_alias = 'DOC-MH'; 

  -- 5. Delete the Auth User (Private)
  DELETE FROM auth.users WHERE email = 'doc.mh@sector.mil';
  DELETE FROM auth.users WHERE email = 'docmh@example.com';
COMMIT;
