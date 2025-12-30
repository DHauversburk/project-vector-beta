-- Migration: Enable Supply-First Architecture
-- 1. Allow empty slots (member_id can be null)
ALTER TABLE appointments ALTER COLUMN member_id DROP NOT NULL;

-- 2. Add is_booked flag (optional but requested by user for explicit state)
ALTER TABLE appointments ADD COLUMN is_booked boolean DEFAULT false;

-- 3. Update RLS: Members see their own appointments OR open slots
DROP POLICY IF EXISTS "Members can view own appointments." ON appointments;

CREATE POLICY "Members can view own and open appointments." ON appointments
  FOR SELECT USING (
    auth.uid() = member_id      -- Own
    OR 
    (member_id IS NULL)         -- Open / Supply
  );

-- 4. Update RLS: Members can 'Booking' (Update) empty slots
--    They need to claim a slot (UPDATE member_id = them, is_booked = true)
CREATE POLICY "Members can book open slots." ON appointments
  FOR UPDATE USING (
    member_id IS NULL           -- Can only target empty slots
  )
  WITH CHECK (
    auth.uid() = member_id      -- Can only set it to themselves
  );

-- 5. Providers need to INSERT slots with NULL member_id
DROP POLICY IF EXISTS "Members can create appointments." ON appointments; 
-- (Actually, we might want to keep this for 'Walk-in' or if the patient creates a demand? 
--  But purely Supply-First means Providers create. 
--  For now, we'll allow Providers to INSERT (already have 'Providers can view assigned' & 'update assigned').
--  We need 'Providers can insert'.
CREATE POLICY "Providers can create slots." ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() = provider_id    -- Can only create slots for themselves
  );

-- Note: Existing "Members can create appointments" policy allowed INSERT with member_id=uid.
-- We might want to DISABLE that for pure Supply-First, but let's leave it for now or rename/revise?
-- If we want to strictly enforce Supply-First, we should DROP it.
DROP POLICY IF EXISTS "Members can create appointments." ON appointments;
