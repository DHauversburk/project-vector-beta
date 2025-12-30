-- Enable Providers to provision Member tokens
-- 1. Add created_by column to track who made the token
-- 2. Create safe RPC for non-admins (Providers) to create Members only

-- A. Schema Update
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

-- B. RPC Function
CREATE OR REPLACE FUNCTION provision_member(
    p_token text,
    p_service_type text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role text;
  v_new_id uuid;
  v_email text;
BEGIN
  -- 1. Permission Check
  -- Allow Admins OR Providers
  SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  IF v_caller_role NOT IN ('admin', 'provider') AND v_email NOT LIKE '%admin%' THEN
     RAISE EXCEPTION 'Unauthorized: Only Providers or Admins can generate tokens.';
  END IF;

  -- 2. Create Identity (Auth)
  v_new_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    role, 
    aud,
    last_sign_in_at
  )
  VALUES (
     v_new_id,
     lower(p_token) || '@vector.mil',
     crypt('SecurePass2025!', gen_salt('bf')),
     now(),
     '{"provider": "email", "providers": ["email"]}',
     jsonb_build_object('token_alias', p_token, 'role', 'member', 'service_type', p_service_type, 'created_by', auth.uid()),
     now(),
     now(),
     'authenticated',
     'authenticated',
     NULL -- Never signed in
  );

  -- 3. Create Profile (Public)
  INSERT INTO public.users (id, role, service_type, token_alias, created_by, created_at)
  VALUES (v_new_id, 'member', p_service_type, p_token, auth.uid(), now());

  RETURN v_new_id;
END;
$$;
