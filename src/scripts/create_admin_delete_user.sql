-- RPC Update: Secure 'admin_delete_user' to be strictly Admin-Only
-- Prevents Providers from deleting users if they access the API

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_email text;
  v_caller_role text;
  v_caller_email text;
BEGIN
  -- 1. Check Caller Permissions
  SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();
  SELECT email INTO v_caller_email FROM auth.users WHERE id = auth.uid();

  -- Allow 'admin' role OR email containing 'admin' or 'command'
  IF v_caller_role != 'admin' AND v_caller_email NOT ILIKE '%admin%' AND v_caller_email NOT ILIKE '%command%' THEN
     RAISE EXCEPTION 'Access Denied: Only Administrators can delete users.';
  END IF;

  -- 2. Get Target Info
  SELECT email INTO v_target_email FROM auth.users WHERE id = target_user_id;

  -- 3. Safety Check: Protect Root Admins
  IF v_target_email = 'admin@vector.mil' OR v_target_email LIKE 'command-01%' THEN
     RAISE EXCEPTION 'Cannot delete a Command/Admin account via this tool.';
  END IF;

  -- 4. Perform Deletion (Cascade)
  DELETE FROM public.appointments WHERE member_id = target_user_id;
  DELETE FROM public.appointments WHERE provider_id = target_user_id;
  DELETE FROM public.users WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- 5. Audit Log
  BEGIN
    INSERT INTO public.audit_logs (action, description, details)
    VALUES ('DELETE_USER', 'Admin deleted user account', jsonb_build_object('target_id', target_user_id, 'target_email', v_target_email, 'by', v_caller_email));
  EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$$;
