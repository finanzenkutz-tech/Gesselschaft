-- Add new columns to group_places table
ALTER TABLE group_places
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS amenities text[], -- Array of strings e.g. ['parking', 'food', 'shisha']
ADD COLUMN IF NOT EXISTS description text;

-- Create an index for faster location queries if needed later
CREATE INDEX IF NOT EXISTS idx_group_places_location ON group_places (group_id);

-- Explicitly allow update for members if not already handled
-- (Assuming RLS policies are already in place, but ensuring update works for creators/admins)
-- If you need to recreate policies, do it here. For now, assuming existing RLS is fine or will be updated if broken.
