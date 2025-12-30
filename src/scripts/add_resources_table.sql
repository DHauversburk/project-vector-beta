-- Create Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL CHECK (category IN ('video', 'article', 'worksheet', 'exercise', 'other')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy: Providers can do everything with their own resources
CREATE POLICY "Providers manage own resources" ON resources
  FOR ALL
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Policy: Authenticated users (Members) can view all resources
-- (In a strict system, might limit to only providers they've seen, but educational content is often public/shared)
CREATE POLICY "Authenticated users can view resources" ON resources
  FOR SELECT
  TO authenticated
  USING (true);
