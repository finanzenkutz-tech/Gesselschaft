-- Add emoji column to groups table
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎲';
