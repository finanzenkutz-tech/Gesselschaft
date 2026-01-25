-- Ensure all group columns exist for location and settings
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS emoji text DEFAULT '🎲';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS location_name text DEFAULT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_location_public boolean DEFAULT false;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_groups_location ON public.groups (latitude, longitude);
