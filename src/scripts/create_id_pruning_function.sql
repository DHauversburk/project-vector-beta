-- Function to prune inactive member accounts
-- Usage: SELECT admin_prune_unused_accounts(60); -- Delete members inactive for >60 days

CREATE OR REPLACE FUNCTION admin_prune_unused_accounts(days_inactive int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int;
BEGIN
  -- Defensive check: Don't allow pruning under 7 days to prevent accidents
  IF days_inactive < 7 THEN
    RAISE EXCEPTION 'Safety threshold too low. Minimum 7 days.';
  END IF;

  WITH deleted AS (
    DELETE FROM auth.users
    WHERE 
      -- TARGET: Only Members
      id IN (SELECT id FROM public.users WHERE role = 'member')
      
      -- SAFETY: Exclude known persistence patterns just in case
      AND email NOT ILIKE '%admin%' 
      AND email NOT ILIKE '%doctor%'
      AND email NOT ILIKE '%provider%'
      
      -- CRITERIA:
      AND (
         -- 1. Never signed in, created long ago (Abandoned Tokens)
         (last_sign_in_at IS NULL AND created_at < NOW() - (days_inactive || ' days')::interval)
         OR
         -- 2. Signed in long ago (Stale Accounts)
         (last_sign_in_at < NOW() - (days_inactive || ' days')::interval)
      )
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  -- Optional: Log to audit_logs if table exists
  BEGIN
    INSERT INTO public.audit_logs (action, description, details)
    VALUES ('PRUNE_USERS', 'Bulk prune of inactive users', jsonb_build_object('count', deleted_count, 'days_threshold', days_inactive));
  EXCEPTION WHEN undefined_table THEN
    -- Ignore if audit_logs doesn't exist
    NULL;
  END;

  RETURN deleted_count;
END;
$$;
