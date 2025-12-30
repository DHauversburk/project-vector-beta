-- Add created_at column to public.users to support sorting
-- Fixes Error 42703: column users.created_at does not exist

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Optional: Backfill existing rows with a rough timestamp if null
UPDATE public.users 
SET created_at = NOW() 
WHERE created_at IS NULL;
