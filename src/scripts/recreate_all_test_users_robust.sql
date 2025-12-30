-- RECREATE ALL TEST USERS (ROBUST / MANUAL SYNC)
-- Bypasses Triggers entirely by manually inserting into both Auth and Public tables.
-- Ensures consistent state and avoids "Database Error Querying Schema".

DO $$
DECLARE
  -- Define UUIDs to ensure match between Auth and Public
  fam_uid uuid := gen_random_uuid();
  pt_uid uuid := gen_random_uuid();
  admin_uid uuid := gen_random_uuid();
  pat1_uid uuid := gen_random_uuid();
  pat2_uid uuid := gen_random_uuid();
BEGIN

  --------------------------------------------------------------------------------
  -- 1. CLEANUP OLD DATA
  --------------------------------------------------------------------------------
  DELETE FROM public.users WHERE token_alias IN ('DOC-FAM','DOC-PT','COMMAND-01','PATIENT-01','PATIENT-02');
  DELETE FROM auth.users WHERE email IN ('doc_fam@example.com', 'doc_pt@example.com', 'admin@example.com', 'patient01@example.com', 'patient02@example.com');

  --------------------------------------------------------------------------------
  -- 2. CREATE USERS (Pairwise Insert)
  --------------------------------------------------------------------------------

  -- === DOC-FAM (See Patients, Red Team) ===
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (fam_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'doc_fam@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(), '{"token_alias": "DOC-FAM", "service_type": "FH_RED", "role": "provider"}');
  
  INSERT INTO public.users (id, token_alias, role, service_type, status)
  VALUES (fam_uid, 'DOC-FAM', 'provider', 'FH_RED', 'active')
  ON CONFLICT (id) DO UPDATE SET token_alias = EXCLUDED.token_alias, role = EXCLUDED.role, service_type = EXCLUDED.service_type, status = EXCLUDED.status;


  -- === DOC-PT (Blue Team) ===
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (pt_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'doc_pt@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(), '{"token_alias": "DOC-PT", "service_type": "PT_BLUE", "role": "provider"}');
  
  INSERT INTO public.users (id, token_alias, role, service_type, status)
  VALUES (pt_uid, 'DOC-PT', 'provider', 'PT_BLUE', 'active')
  ON CONFLICT (id) DO UPDATE SET token_alias = EXCLUDED.token_alias, role = EXCLUDED.role, service_type = EXCLUDED.service_type, status = EXCLUDED.status;


  -- === COMMAND-01 (Admin) ===
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(), '{"token_alias": "COMMAND-01", "role": "admin"}');
  
  INSERT INTO public.users (id, token_alias, role, service_type, status)
  VALUES (admin_uid, 'COMMAND-01', 'admin', 'ALL', 'active')
  ON CONFLICT (id) DO UPDATE SET token_alias = EXCLUDED.token_alias, role = EXCLUDED.role, service_type = EXCLUDED.service_type, status = EXCLUDED.status;


  -- === PATIENT-01 ===
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (pat1_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'patient01@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(), '{"token_alias": "PATIENT-01", "role": "member"}');
  
  INSERT INTO public.users (id, token_alias, role, service_type, status)
  VALUES (pat1_uid, 'PATIENT-01', 'member', 'ALL', 'active')
  ON CONFLICT (id) DO UPDATE SET token_alias = EXCLUDED.token_alias, role = EXCLUDED.role, service_type = EXCLUDED.service_type, status = EXCLUDED.status;


  -- === PATIENT-02 ===
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (pat2_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'patient02@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(), '{"token_alias": "PATIENT-02", "role": "member"}');
  
  INSERT INTO public.users (id, token_alias, role, service_type, status)
  VALUES (pat2_uid, 'PATIENT-02', 'member', 'ALL', 'active')
  ON CONFLICT (id) DO UPDATE SET token_alias = EXCLUDED.token_alias, role = EXCLUDED.role, service_type = EXCLUDED.service_type, status = EXCLUDED.status;

END $$;
