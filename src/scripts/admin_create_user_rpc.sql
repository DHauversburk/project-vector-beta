-- ADMIN CREATE USER RPC
-- Enables the 'COMMAND-01' Admin to create new users (Auth + Public) directly from the dashboard via SQL RPC.
-- This bypasses the need for Supabase Dashboard access for day-to-day user management.

CREATE OR REPLACE FUNCTION admin_create_user(
    new_email text,
    new_password text,
    new_token text,
    new_role text,
    new_service_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges to access auth.users
AS $$
DECLARE
    new_id uuid;
    executing_user_role text;
BEGIN
    -- 1. Check Permissions: The caller must be an 'admin' in public.users
    SELECT role INTO executing_user_role FROM public.users WHERE id = auth.uid();
    
    IF executing_user_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Access Denied: Only Admins can invoke this function.';
    END IF;

    -- 2. Generate new UUID
    new_id := gen_random_uuid();

    -- 3. Insert into auth.users
    -- We construct the metadata so the trigger (if active) works, but we also manually handle public.users below.
    INSERT INTO auth.users (
        id, 
        instance_id, 
        aud, 
        role, 
        email, 
        encrypted_password, 
        email_confirmed_at, 
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        new_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        new_email,
        crypt(new_password, gen_salt('bf')),
        now(),
        jsonb_build_object(
            'token_alias', new_token,
            'role', new_role,
            'service_type', new_service_type
        ),
        now(),
        now()
    );

    -- 4. Insert/Upsert into public.users (Robustness)
    INSERT INTO public.users (id, token_alias, role, service_type, status)
    VALUES (new_id, new_token, new_role, new_service_type, 'active')
    ON CONFLICT (id) DO UPDATE SET
        token_alias = EXCLUDED.token_alias,
        role = EXCLUDED.role,
        service_type = EXCLUDED.service_type,
        status = 'active';

    RETURN new_id;
END;
$$;
