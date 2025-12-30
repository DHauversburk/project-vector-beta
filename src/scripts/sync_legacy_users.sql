-- Sync Legacy/Demo Users to Auth System (Fixed for 42P10)
-- Uses PL/pgSQL to safely UPSERT users without relying on ambiguous Constraint inference.

DO $$
DECLARE
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN

  -- 1. DOC-MH (Mental Health)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'doc_mh@example.com') THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
    WHERE email = 'doc_mh@example.com';
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 
      'doc_mh@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
      '{"provider": true, "providers": ["project_vector"]}', 
      '{"token_alias": "DOC-MH", "service_type": "MH_GREEN"}', 
      now(), now()
    );
  END IF;

  -- 2. DOC-FAM (Family Health)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'doc_fam@example.com') THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
    WHERE email = 'doc_fam@example.com';
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 
      'doc_fam@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
      '{"provider": true, "providers": ["project_vector"]}', 
      '{"token_alias": "DOC-FAM", "service_type": "FH_RED"}', 
      now(), now()
    );
  END IF;

  -- 3. DOC-PT (Physical Therapy)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'doc_pt@example.com') THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
    WHERE email = 'doc_pt@example.com';
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 
      'doc_pt@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
      '{"provider": true, "providers": ["project_vector"]}', 
      '{"token_alias": "DOC-PT", "service_type": "PT_BLUE"}', 
      now(), now()
    );
  END IF;

  -- 4. PATIENT-01
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'patient01@example.com') THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
    WHERE email = 'patient01@example.com';
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 
      'patient01@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
      '{"provider": false, "providers": ["project_vector"]}', 
      '{"token_alias": "PATIENT-01"}', 
      now(), now()
    );
  END IF;

   -- 5. COMMAND-01 (Admin)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
    WHERE email = 'admin@example.com';
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 
      'admin@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
      '{"provider": true, "providers": ["project_vector"], "role": "admin"}', 
      '{"token_alias": "COMMAND-01"}', 
      now(), now()
    );
  END IF;

END $$;
