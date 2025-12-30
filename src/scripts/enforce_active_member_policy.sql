-- SECURITY PATCH: Enforce Active Status for Booking
-- Prevents disabled members from claiming slots (Supply Consumption).

-- 1. Drop the loose policy
DROP POLICY IF EXISTS "Members can book open slots." ON appointments;

-- 2. Create strict policy
-- Rule: You can only UPDATE (Book) a slot IF:
--   a) It is currently empty (member_id IS NULL)
--   b) You are setting it to YOURSELF (auth.uid() = member_id)
--   c) Your account status is 'active' in the users table

CREATE POLICY "Members can book open slots." ON appointments
  FOR UPDATE USING (
    member_id IS NULL -- Can only target empty slots
    AND exists (
      select 1 from users
      where users.id = auth.uid()
      and users.status = 'active' -- <--- CRITICAL SECURITY CHECK
    )
  )
  WITH CHECK (
    auth.uid() = member_id
    -- No need to re-check status here if USING clause handles the row visibility/lock, 
    -- but standard practice for UPDATE is checking both.
    AND exists (
      select 1 from users
      where users.id = auth.uid()
      and users.status = 'active'
    )
  );

-- 3. Also protect the VIEW policy?
-- If a user is disabled, maybe they shouldn't even SEE slots.
DROP POLICY IF EXISTS "Members can view own and open appointments." ON appointments;

CREATE POLICY "Members can view own and open appointments." ON appointments
  FOR SELECT USING (
    -- Must be active to see anything OR be the owner (maybe allow viewing own history even if disabled?)
    -- Let's be strict: Active users only.
    exists (
        select 1 from users
        where users.id = auth.uid()
        and users.status = 'active'
    )
    AND
    (
        auth.uid() = member_id      -- Own
        OR 
        (member_id IS NULL)         -- Open / Supply
    )
  );
