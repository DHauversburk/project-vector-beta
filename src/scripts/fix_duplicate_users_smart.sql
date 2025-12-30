-- Smart Deduplication Script
-- Merges duplicate users by moving data (Appointments, etc.) to the valid Auth User
-- and deleting the orphaned/legacy profiles.

DO $$
DECLARE
  v_good_id uuid;
  v_bad_id uuid;
  v_alias text;
  v_email text;
  r record;
BEGIN
  -- List of users to fix [Alias, Email]
  FOR r IN (
    SELECT * FROM (VALUES 
      ('DOC-MH', 'doc_mh@example.com'),
      ('DOC-FAM', 'doc_fam@example.com'),
      ('DOC-PT', 'doc_pt@example.com'),
      ('PATIENT-01', 'patient01@example.com'),
      ('COMMAND-01', 'admin@example.com')
    ) AS t(alias, email)
  ) LOOP
  
    -- 1. Identify the GOOD ID (The one that actually exists in Auth system)
    SELECT id INTO v_good_id FROM auth.users WHERE email = r.email;
    
    IF v_good_id IS NOT NULL THEN
      RAISE NOTICE 'Processing % (Good ID: %)', r.alias, v_good_id;

      -- 2. Find any BAD IDs (Public profiles with same alias but different ID)
      FOR v_bad_id IN SELECT id FROM public.users WHERE token_alias = r.alias AND id != v_good_id LOOP
        
        RAISE NOTICE '  - Merging data from Legacy/Bad ID: %', v_bad_id;

        -- 3. Move Data (Appointments)
        -- Update provider_id
        UPDATE appointments SET provider_id = v_good_id WHERE provider_id = v_bad_id;
        -- Update member_id
        UPDATE appointments SET member_id = v_good_id WHERE member_id = v_bad_id;

        -- Move Resources
        UPDATE resources SET provider_id = v_good_id WHERE provider_id = v_bad_id;

        -- 4. Delete the Bad Profile
        DELETE FROM public.users WHERE id = v_bad_id;
        
      END LOOP;
    ELSE
      RAISE NOTICE 'Skipping % - No Auth User found', r.alias;
    END IF;

  END LOOP;
  
  -- Extra Cleanup: Delete any public.users rows that have NO matching auth.users row
  -- (Commented out for safety, but usually good practice to keep them in sync)
  -- DELETE FROM public.users WHERE id NOT IN (SELECT id FROM auth.users);

END $$;
