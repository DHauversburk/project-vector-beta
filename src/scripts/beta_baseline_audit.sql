
-- PROJECT VECTOR: Beta Baseline Consistency Audit
-- This script ensures all tables, indices, and RLS policies are aligned with Phase 5 requirements.
-- This script is NON-DESTRUCTIVE (uses IF NOT EXISTS / CREATE OR REPLACE).

-- 1. Table: Users (Verify columns)
-- Use DO block to add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status text DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='token_alias') THEN
        ALTER TABLE users ADD COLUMN token_alias text;
        ALTER TABLE users ADD CONSTRAINT users_token_alias_key UNIQUE (token_alias);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='service_type') THEN
        ALTER TABLE users ADD COLUMN service_type text;
    END IF;
END $$;

-- 2. Table: Appointments (Verify Supply-First columns)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='is_booked') THEN
        ALTER TABLE appointments ADD COLUMN is_booked boolean DEFAULT false;
    END IF;
    -- Ensure member_id is nullable for Supply-First
    ALTER TABLE appointments ALTER COLUMN member_id DROP NOT NULL;
END $$;

-- 3. Optimization: Indices
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_member_id ON appointments(member_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_token_alias ON users(token_alias);

-- 4. RLS Policy Audit: Users
-- Ensure only active users can login/be seen in searches
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users
  FOR SELECT USING (
    status = 'active'
    OR auth.uid() = id -- Allow disabled users to still see their own profile? Or maybe not.
  );

-- 5. RLS Policy Audit: Appointments (The "Active Member" security check)
DROP POLICY IF EXISTS "Members can book open slots." ON appointments;
CREATE POLICY "Members can book open slots." ON appointments
  FOR UPDATE USING (
    member_id IS NULL 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'active')
  )
  WITH CHECK (
    auth.uid() = member_id
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Members can view own and open appointments." ON appointments;
CREATE POLICY "Members can view own and open appointments." ON appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'active')
    AND (auth.uid() = member_id OR member_id IS NULL)
  );

-- 6. Feedback Table & Policies (Write-Once)
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members Submit Feedback" ON feedback;
CREATE POLICY "Members Submit Feedback" ON feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = feedback.appointment_id
      AND a.member_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers View Own Feedback" ON feedback;
CREATE POLICY "Providers View Own Feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = feedback.appointment_id
      AND a.provider_id = auth.uid()
    )
  );

-- 7. Analytics View (Optional helper for cleaner querying)
-- This allows providers to quickly see their stats
CREATE OR REPLACE VIEW provider_analytics AS
SELECT 
    provider_id,
    count(*) as total_slots,
    count(*) FILTER (WHERE member_id IS NOT NULL) as booked_slots,
    round(count(*) FILTER (WHERE member_id IS NOT NULL)::numeric / count(*)::numeric * 100, 2) as utilization
FROM appointments
GROUP BY provider_id;
