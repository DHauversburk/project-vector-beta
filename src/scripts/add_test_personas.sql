-- Add Test Personas (High-Entropy Identifiers)
-- Run this in Supabase SQL Editor

-- 1. Red Team PCM (Token: R-TEAM-99X2)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'doc_red@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
  '{"provider": true, "providers": ["project_vector"]}', 
  '{"token_alias": "R-TEAM-99X2", "service_type": "FAMILY_RED"}', 
  now(), now()
);

-- 2. Blue Team PT (Token: B-TEAM-77K1)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'doc_blue@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
  '{"provider": true, "providers": ["project_vector"]}', 
  '{"token_alias": "B-TEAM-77K1", "service_type": "PT_BLUE"}', 
  now(), now()
);

-- 3. High-Entropy Member Tokens
-- Member 01 (M-8821-X4)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'patient01@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
  '{"provider": false, "providers": ["project_vector"]}', 
  '{"token_alias": "M-8821-X4"}', 
  now(), now()
);

-- Member 02 (M-3392-L9)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'patient02@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
  '{"provider": false, "providers": ["project_vector"]}', 
  '{"token_alias": "M-3392-L9"}', 
  now(), now()
);

-- Member 03 (M-1102-P2)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'patient03@example.com', crypt('SecurePass2025!', gen_salt('bf')), now(),
  '{"provider": false, "providers": ["project_vector"]}', 
  '{"token_alias": "M-1102-P2"}', 
  now(), now()
);
