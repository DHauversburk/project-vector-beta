-- MASTER RPC FIX SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX:
-- 1. Audit Logging (Missing Table/RPCs)
-- 2. Pruning (Missing RPC)
-- 3. General Admin functions

BEGIN;

--------------------------------------------------------------------------------
-- 1. AUDIT LOGGING SYSTEM
--------------------------------------------------------------------------------

-- Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type text NOT NULL,
    description text,
    severity text CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    metadata jsonb DEFAULT '{}',
    user_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can view all
DROP POLICY IF EXISTS "Admins view all logs" ON public.audit_logs;
CREATE POLICY "Admins view all logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Policy: System can insert (via Check)
DROP POLICY IF EXISTS "System insert logs" ON public.audit_logs;
CREATE POLICY "System insert logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- RPC: Log Event
-- DROP first to allow return type changes if needed
DROP FUNCTION IF EXISTS log_event(text, text, text, jsonb);

CREATE OR REPLACE FUNCTION log_event(p_action_type text, p_description text, p_severity text, p_metadata jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (action_type, description, severity, metadata, user_id)
  VALUES (p_action_type, p_description, p_severity, p_metadata, auth.uid());
END;
$$;

-- RPC: Get Audit Logs (With Filters)
DROP FUNCTION IF EXISTS get_audit_logs(int, text, text);

CREATE OR REPLACE FUNCTION get_audit_logs(p_limit int, p_type text, p_severity text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  token_alias text,
  role text,
  action_type text,
  description text,
  metadata jsonb,
  severity text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    u.token_alias,
    u.role,
    al.action_type,
    al.description,
    al.metadata,
    al.severity,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.users u ON al.user_id = u.id
  WHERE (p_type IS NULL OR al.action_type = p_type)
    AND (p_severity IS NULL OR al.severity = p_severity)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

--------------------------------------------------------------------------------
-- 2. PRUNING SYSTEM
--------------------------------------------------------------------------------

-- RPC: Prune Inactive Users
DROP FUNCTION IF EXISTS admin_prune_unused_accounts(int);

CREATE OR REPLACE FUNCTION admin_prune_unused_accounts(days_inactive int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int;
BEGIN
  -- Safety Minimum
  IF days_inactive < 7 THEN 
    RAISE EXCEPTION 'Safety threshold too low. Minimum 7 days.'; 
  END IF;
  
  -- Perform Delete
  WITH deleted AS (
    DELETE FROM auth.users
    WHERE id IN (SELECT id FROM public.users WHERE role = 'member')
    -- Vital Protections
    AND email NOT ILIKE '%admin%' 
    AND email NOT ILIKE '%doctor%'
    AND email NOT ILIKE '%provider%'
    AND email NOT ILIKE '%command%'
    -- Inactivity Logic
    AND (
         (last_sign_in_at IS NULL AND created_at < NOW() - (days_inactive || ' days')::interval)
         OR
         (last_sign_in_at < NOW() - (days_inactive || ' days')::interval)
    )
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  
  -- Audit the action
  PERFORM log_event('PRUNE_USERS', 'Pruned ' || deleted_count || ' inactive users (>' || days_inactive || ' days)', 'WARN', jsonb_build_object('count', deleted_count));
  
  RETURN deleted_count;
END;
$$;

COMMIT;
