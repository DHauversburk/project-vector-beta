-- Enable Token Management for Providers and Admins

-- 1. SEARCH: Providers need to search for members by Token Alias to manage them.
-- Existing policy "Public profiles are viewable by everyone" (lines 30-31) allows SELECT for now. 
-- In a real prod environment, we might restrict this, but for this MVP, it's fine.

-- 2. UPDATE: Providers need to update 'status' (Disable) or 'token_alias' (Re-Key) for MEMBERS.
-- They should NOT be able to update other Providers or Admins.

CREATE POLICY "Providers can update members." ON users
  FOR UPDATE USING (
    -- The User acting is a Provider
    exists (
      select 1 from users as u
      where u.id = auth.uid()
      and u.role = 'provider'
      and u.status = 'active'
    )
    -- AND the Target User is a Member
    AND role = 'member'
  );

-- 3. Also ensure Admins can update anyone (except maybe Super Admins, but we don't have that yet)
CREATE POLICY "Admins can update anyone." ON users
  FOR UPDATE USING (
    exists (
      select 1 from users as u
      where u.id = auth.uid()
      and u.role = 'admin'
      and u.status = 'active'
    )
  );

-- 4. RPC for Re-Keying (Optional, but safer for consistency?)
-- Actually, a direct update to `token_alias` is fine since it has a UNIQUE constraint.
-- If they try to Re-Key to an existing alias, DB will throw error, which UI can handle.

-- 5. Helper Indeces
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_token_alias ON users(token_alias);
