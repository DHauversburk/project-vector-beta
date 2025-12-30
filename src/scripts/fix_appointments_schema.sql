-- Database Fix: Appointments Schema Restoration
-- 1. Make member_id nullable to allow for empty (unbooked) slots
-- 2. Update status constraint to include 'blocked'

-- First, drop the existing constraint to modify it
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add the updated constraint
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'blocked'));

-- Make member_id nullable
ALTER TABLE appointments 
ALTER COLUMN member_id DROP NOT NULL;
