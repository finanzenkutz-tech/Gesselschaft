-- Add Pile of Shame support
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS is_unplayed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS complexity numeric(3, 1) CHECK (complexity >= 1 AND complexity <= 5);

COMMENT ON COLUMN public.inventory.is_unplayed IS 'Flag for Pile of Shame (owned but not played)';
COMMENT ON COLUMN public.inventory.complexity IS 'Game complexity rating (1-5, like BGG weight)';
