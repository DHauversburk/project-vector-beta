-- NUCLEAR FIX for DOC-MH
-- Deletes the user entirely so it can be re-created cleanly via the App/Client.
-- This resolves "Database Error Querying Schema" caused by corrupted manual SQL inserts.

BEGIN;
  -- Delete from Public Profile first (Foreign Key)
  DELETE FROM public.users WHERE token_alias = 'DOC-MH'; 

  -- Delete from Auth Users (The Root Cause)
  DELETE FROM auth.users WHERE email = 'doc.mh@sector.mil';
  DELETE FROM auth.users WHERE email = 'docmh@example.com';
COMMIT;
