-- ULTIMATE USER FIX V2 (Trigger-Safe)
-- Inserts into auth.users, then SAFELY upserts into public.users.
-- This handles cases where a Trigger might or might not auto-create the public profile.

DO $$
DECLARE
  new_uid uuid := gen_random_uuid();
  test_email text := 'doc.mh.final@gmail.com';
BEGIN
  -- 1. CLEANUP
  -- Delete existing entries to prevent Unique Constraint violations on Email or Token
  DELETE FROM public.users WHERE token_alias = 'DOC-MH';
  DELETE FROM auth.users WHERE email = test_email;

  -- 2. INSERT INTO AUTH.USERS
  -- This typically fires a Trigger to create public.users(id)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_uid,
    'authenticated',
    'authenticated',
    test_email,
    crypt('SecurePass2025!', gen_salt('bf')),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"token_alias": "DOC-MH", "service_type": "MH_GREEN", "provider": true}',
    now(),
    now(),
    false
  );

  -- 3. UPSERT INTO PUBLIC.USERS
  -- If trigger created it, we update fields. If not, we insert.
  INSERT INTO public.users (
    id,
    token_alias,
    role,
    service_type,
    status
  ) VALUES (
    new_uid,
    'DOC-MH',
    'provider',
    'MH_GREEN',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    token_alias = EXCLUDED.token_alias,
    role = EXCLUDED.role,
    service_type = EXCLUDED.service_type,
    status = EXCLUDED.status;

END $$;
