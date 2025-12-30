-- RECREATE ALL TEST USERS (Batch Fix)
-- Cleans up old corrupt users and inserts fresh ones.
-- Relies on the newly repaired 'on_auth_user_created' trigger to sync public profiles.

BEGIN;

  --------------------------------------------------------------------------------
  -- 1. CLEANUP (Delete old zombie users to prevent conflicts)
  --------------------------------------------------------------------------------
  
  -- PRE-CLEANUP: Remove dependent appointments to avoid invalid foreign key constraints
  DELETE FROM public.appointments WHERE member_id IN (SELECT id FROM public.users WHERE token_alias IN ('PATIENT-01', 'PATIENT-02'));
  DELETE FROM public.appointments WHERE provider_id IN (SELECT id FROM public.users WHERE token_alias IN ('DOC-FAM', 'DOC-OM', 'DOC-PT'));

  -- DOC-OM
  DELETE FROM public.users WHERE token_alias = 'DOC-OM';
  DELETE FROM auth.users WHERE email = 'doc_om@example.com' OR email = 'doc.om@sector.mil';

  -- DOC-PT
  DELETE FROM public.users WHERE token_alias = 'DOC-PT';
  DELETE FROM auth.users WHERE email = 'doc_pt@example.com' OR email = 'doc.pt@sector.mil';

  -- COMMAND-01
  DELETE FROM public.users WHERE token_alias = 'COMMAND-01';
  DELETE FROM auth.users WHERE email = 'admin@example.com' OR email = 'command.01@sector.mil';

  -- PATIENT-01
  DELETE FROM public.users WHERE token_alias = 'PATIENT-01';
  DELETE FROM auth.users WHERE email = 'patient01@example.com' OR email = 'patient.01@sector.mil';

  -- PATIENT-02
  DELETE FROM public.users WHERE token_alias = 'PATIENT-02';
  DELETE FROM auth.users WHERE email = 'patient02@example.com' OR email = 'patient.02@sector.mil';

  --------------------------------------------------------------------------------
  -- 2. INSERT NEW USERS (Triggers will create Public Profiles)
  --------------------------------------------------------------------------------
  
  -- DOC-OM (Red Team)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'doc_om@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
    '{"token_alias": "DOC-OM", "service_type": "PCM_RED", "role": "provider"}', now(), now()
  );

  -- DOC-PT (Blue Team)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'doc_pt@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
    '{"token_alias": "DOC-PT", "service_type": "PT_BLUE", "role": "provider"}', now(), now()
  );

  -- COMMAND-01 (Admin)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'admin@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
    '{"token_alias": "COMMAND-01", "role": "admin"}', now(), now()
  );

  -- PATIENT-01
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'patient01@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
    '{"token_alias": "PATIENT-01", "role": "member"}', now(), now()
  );

  -- PATIENT-02
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'patient02@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
    '{"token_alias": "PATIENT-02", "role": "member"}', now(), now()
  );

COMMIT;
