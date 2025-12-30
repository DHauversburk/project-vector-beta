-- CLEANUP BROKEN TEST USERS
-- Prepares the database for manual recreation of test users via the Dashboard.

DELETE FROM public.users WHERE token_alias IN ('DOC-FAM','DOC-PT','COMMAND-01','PATIENT-01','PATIENT-02');
DELETE FROM auth.users WHERE email IN ('doc_fam@example.com', 'doc_pt@example.com', 'admin@example.com', 'patient01@example.com', 'patient02@example.com');
