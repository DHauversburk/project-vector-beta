-- LINK PROFILE AFTER GUI CREATION
-- Run this AFTER creating 'doc.mh.final@gmail.com' in the Supabase Dashboard.

INSERT INTO public.users (id, token_alias, role, service_type, status)
SELECT id, 'DOC-MH', 'provider', 'MH_GREEN', 'active'
FROM auth.users
WHERE email = 'doc.mh.final@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
  token_alias = 'DOC-MH',
  role = 'provider',
  service_type = 'MH_GREEN';
