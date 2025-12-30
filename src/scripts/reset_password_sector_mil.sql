-- PASSWORD RESET SCRIPT for @sector.mil Accounts
-- Forces the password to 'SecurePass2025!' for real accounts, ensuring you can log in.

-- 1. Reset DOC-MH
UPDATE auth.users 
SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
WHERE email = 'doc.mh@sector.mil';

-- 2. Reset DOC-FAM
UPDATE auth.users 
SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
WHERE email = 'doc.fam@sector.mil';

-- 3. Reset DOC-PT
UPDATE auth.users 
SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
WHERE email = 'doc.pt@sector.mil';

-- 4. Reset COMMAND-01
UPDATE auth.users 
SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
WHERE email = 'command.01@sector.mil';

-- 5. Reset PATIENT-01
UPDATE auth.users 
SET encrypted_password = crypt('SecurePass2025!', gen_salt('bf')) 
WHERE email = 'patient.01@sector.mil';

-- Confirm by returning the email (optional, for checking)
SELECT email, updated_at FROM auth.users WHERE email LIKE '%@sector.mil';
