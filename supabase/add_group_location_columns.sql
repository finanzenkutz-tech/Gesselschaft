-- Add location columns to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_location_public boolean DEFAULT false;

-- Add index for geospatial queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_groups_location ON public.groups (latitude, longitude);
