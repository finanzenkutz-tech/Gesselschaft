-- Fix missing emoji column in groups table
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS emoji text DEFAULT '🎲';
